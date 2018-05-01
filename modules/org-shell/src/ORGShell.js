
"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , R = require('ramda')
    , PropTypes = require('prop-types')
    , { Provider, connect } = require('react-redux')
    , querystring = require('querystring')
    , through = require('through2')
    , Route = require('./Route')

const NotFound = () => h('h1', null, 'Not Found')

function makeTitledComponent({ baseTitle, makeTitle, Component }) {
  return class TitledComponent extends React.Component {
    componentDidCatch() {
      let title = '';

      if (baseTitle) title += baseTitle;

      if (makeTitle) {
        const resourceTitle = makeTitle(this.props);
        if (title) title += ' | ';
        title += resourceTitle;
      }

      if (title) document.title = title;
    }

    render() {
      return h(Component, this.props)
    }
  }
}

module.exports = function makeORGShell({
  resources,
  createStore,
  NotFoundComponent=NotFound,
  baseTitle='',
}, Component) {
  const store = createStore()
      , locationStream = through.obj()

  resources = R.map(resource =>
    R.merge(resource, ({ Component: makeTitledComponent(resource) })),
    resources
  )

  class ORGShell extends React.Component {
    constructor() {
      super();

      this.state = {
        loadingNewResource: true,
        activeResource: null,
        activeResourceOpts: {},
        errors: [],
      }

      this.updateCurrentOpts = this.updateCurrentOpts.bind(this);

      locationStream
        .on('data', ({ route, pushState }) => {
          this.setApplicationRoute(route, pushState)
        })
        .on('error', e => {
          throw e;
        })
    }

    getChildContext() {
      return { locationStream }
    }

    componentDidMount() {
      const loadCurrentWindowPath = pushState => {
        locationStream.write({
          route: Route.fromPath(window.location.search),
          pushState,
        })
      }

      window.onpopstate = loadCurrentWindowPath.bind(null, false);

      loadCurrentWindowPath(true);
    }

    async setApplicationRoute(route, pushState=true) {
      if (typeof route === 'string') route = Route.fromPath(route)

      let redirectTo

      const { resourceName, params } = route
          , path = route.asURL()

      // FIXME: Mixing resource object and augmenting "params" seems bad. I
      // know I did it for a reason at some point, but that reason may have
      // been impatience and delirium. It's worth revisiting at some point.
      const resource = Object.assign(
        { params },
        resources[resourceName] || { Component: NotFoundComponent }
      )

      const { onBeforeRoute } = resource
          , redirect = url => redirectTo = url

      this.setState({ loadingNewResource: true })

      try {
        let activeResourceExtraProps = {}

        if (onBeforeRoute) {
          activeResourceExtraProps = await onBeforeRoute(store.dispatch, params, redirect)
        }

        if (redirectTo) {
          this.setApplicationRoute(redirectTo);
        } else {
          this.setState({
            activeResource: resource,
            activeResourceName: resourceName,
            activeResourceOpts: JSON.parse(params.opts || '{}'),
            activeResourceExtraProps,
          })

          if (pushState) {
            window.history.pushState(undefined, undefined, path);
          }
        }
      } catch (err) {
          if (pushState) {
            window.history.pushState(undefined, undefined, path);
          }

          this.setState({
            activeResourceName: resourceName,
            activeResource: {
              Component: () => h('div', null, [
                h('h1', null, `Error while loading resource \`${resourceName}\``),
                h('pre', null, err.stack || err),
              ])
            },
            activeResourceOpts: null,
          })

      } finally {
        this.setState({ loadingNewResource: false })
      }
    }

    updateCurrentOpts(fn) {
      const { activeResourceOpts } = this.state
          , nextOpts = fn(activeResourceOpts)

      this.setState(
        { activeResourceOpts: nextOpts },
        () => {
          const nextQuerystring = Object.assign(
            querystring.parse(window.location.search.slice(1)),
            { opts: JSON.stringify(nextOpts) }
          )

          if (!nextOpts || R.isEmpty(nextOpts)) {
            delete nextQuerystring.opts;
          }

          const path = '?' + querystring.stringify(nextQuerystring)

          window.history.replaceState(undefined, undefined, path);
        }
      )
    }

    render() {
      const {
        loadingNewResource,
        errors,
        activeResource,
        activeResourceName,
        activeResourceOpts,
        activeResourceExtraProps,
      } = this.state

      return (
        h(Provider, { store },
          h(Component, {
            loadingNewResource,
            activeResourceName,
            errors,
          }, activeResource && h(activeResource.Component, {
              params: activeResource.params,
              opts: activeResourceOpts,
              updateOpts: this.updateCurrentOpts,
              extra: activeResourceExtraProps,
            })
          )
        )
      )
    }
  }

  ORGShell.childContextTypes = {
    locationStream: PropTypes.object,
  }

  return ORGShell
}
