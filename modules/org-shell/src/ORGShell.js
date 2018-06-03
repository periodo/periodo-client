
"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , R = require('ramda')
    , PropTypes = require('prop-types')
    , { connect, Provider } = require('react-redux')
    , querystring = require('querystring')
    , through = require('through2')
    , Route = require('./Route')

const NotFound = () => h('h1', null, 'Not Found')

function makeTitledComponent(baseTitle, makeTitle) {
  return Component =>  (
    class TitledComponent extends React.Component {
      componentDidMount() {
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
  )
}

module.exports = function makeORGShell({
  resources,
  createStore,
  NotFoundComponent=NotFound,
  baseTitle='',
}, Component) {
  const store = createStore()
      , locationStream = through.obj()

  resources = R.mapObjIndexed((resource, key) =>
    R.merge(resource, ({
      key,
      Component: R.pipe(
        makeTitledComponent(baseTitle, resource.makeTitle),
        connect(resource.mapStateToProps || R.always({})),
      )(resource.Component)
    })),
    resources
  )

  class ORGShell extends React.Component {
    constructor() {
      super();

      this.state = {
        loading: true,

        activeResource: null,
        activeParams: null,
        activeOpts: null,
        activeExtra: null,
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
          route: Route.fromPath(window.location.search + window.location.hash),
          pushState,
        })
      }

      window.onpopstate = loadCurrentWindowPath.bind(null, false);

      loadCurrentWindowPath(true);
    }

    async setApplicationRoute(route, pushState=true) {
      if (typeof route === 'string') route = Route.fromPath(route)

      let redirectTo

      const { resourceName, params, opts } = route
          , path = route.asURL()
          , redirect = url => redirectTo = url

      const resource = resources[resourceName] || { Component: NotFoundComponent }

      this.setState({
        loading: true
      })

      try {
        let extraProps = {}

        if (resource.onBeforeRoute) {
          extraProps = await resource.onBeforeRoute(
            store.dispatch,
            params,
            redirect
          )
        }

        if (redirectTo) {
          this.setApplicationRoute(redirectTo);
        } else {
          this.setState({
            activeResource: resource,
            activeParams: params,
            activeOpts: opts,
            activeExtra: extraProps,
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
            activeResource: {
              Component: () => h('div', null, [
                h('h1', null, `Error while loading resource \`${resourceName}\``),
                h('pre', null, err.stack || err),
              ])
            },
            activeParams: null,
            activeOpts: null,
            activeExtra: null,
          })

      } finally {
        this.setState({ loading: false })
      }
    }

    updateCurrentOpts(fn) {
      const { activeOpts } = this.state
          , nextOpts = fn(activeOpts) || {}

      this.setState(
        { activeOpts: nextOpts },
        () => {
          const nextHash = querystring.stringify(
            R.map(JSON.stringify, nextOpts)
          )

          let nextPath = window.location.pathname + window.location.search

          if (nextHash) nextPath += `#${nextHash}`

          window.history.replaceState(undefined, undefined, nextPath);
        }
      )
    }

    render() {
      const {
        loading,
        activeResource,
        activeParams,
        activeOpts,
        activeExtra,
      } = this.state

      const innerOpts = {
        params: activeParams,
        opts: activeOpts,
        extra: activeExtra,
        updateOpts: this.updateCurrentOpts,
      }

      const outerOpts = R.merge(innerOpts, {
        store,
        loading,
        activeResource,
      })

      return (
        h(Provider, { store },
          h(Component, outerOpts,
            activeResource && h(activeResource.Component, innerOpts)
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
