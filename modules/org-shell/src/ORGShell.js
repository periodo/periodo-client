
"use strict";

const React = require('react')
    , h = React.createElement
    , R = require('ramda')
    , PropTypes = require('prop-types')
    , { Provider, connect } = require('react-redux')
    , querystring = require('querystring')
    , through = require('through2')
    , Route = require('./Route')


const NotFound = () => h('h1', null, 'Not Found')

function transformResources(resources, baseTitle) {
  const wrappedResources = {}

  Object.keys(resources).forEach(name => {
    const resource = resources[name]
        , { Component } = resource

    let WrappedResourceComponent = class WrappedResourceComponent extends React.Component {
      componentDidMount() {
        let title

        const { makeTitle } = resource

        if (baseTitle) {
          title += baseTitle;
        }

        if (makeTitle) {
          try {
            const resourceTitle = makeTitle(this.props)

            if (title) title += ' | ';
            title += resourceTitle;
          } catch (err) {
            /* eslint-disable no-console */
            console.warn(`Error when making resource title for resource ${name}`)
          }
        }

        if (title) document.title = title || '';
      }

      render() {
        return h(Component, Object.assign({}, this.props))
      }
    }

    if (resource.mapStateToProps) {
      WrappedResourceComponent = connect(resource.mapStateToProps)(WrappedResourceComponent)
    }

    WrappedResourceComponent.displayName = `ORGShellResource(${name})`

    wrappedResources[name] = Object.assign({}, resource, {
      Component: WrappedResourceComponent
    })
  })
}

module.exports = function makeORGShell({
  resources,
  createStore,
  NotFoundComponent=NotFound,
  baseTitle='',
}, Component) {
  const locationStream = through.obj()

  const _resources = transformResources(resources, baseTitle)

  const getResourceComponent = name =>
    _resources[name] || { Component: NotFoundComponent }


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
        .on('data', ({ path, route, pushState }) => {
          this.setApplicationRoute(path || route, pushState)
        })
        .on('error', e => {
          throw e;
        })
    }

    getChildContext() {
      return { locationStream }
    }

    componentDidMount() {
      window.onpopstate = () => {
        locationStream.write({
          path: window.location.search,
        })
      }

      locationStream.write({
        path: window.location.search
      })
    }

    async setApplicationRoute(route, pushState) {
      if (typeof route === 'string') route = Route.fromPath(route)

      let redirectTo

      const { resourceName, params } = route
          , path = route.asURL()
          , resource = getResourceComponent(resourceName)
          , { onBeforeRoute } = resource
          , { dispatch } = this.props
          , redirect = url => redirectTo = url

      this.setState({ loadingNewResource: true })

      try {
        if (onBeforeRoute) {
          await onBeforeRoute(dispatch, params, redirect)
        }

        if (redirectTo) {
          this.setApplicationRoute(redirectTo);
        } else {
          this.setState({
            activeResource: resource,
            activeResourceOpts: JSON.parse(params.opts || '{}'),
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
                h('h1', null, 'Error while loading resource: ' + resource.params.page),
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
      const { loadingNewResource, errors, activeResource, activeResourceOpts } = this.state

      return (
        h(Provider, { store: createStore() }, [
          h(Component, {
            loadingNewResource,
            errors,
          }, [
            activeResource && h(activeResource.Component, {
              params: activeResource.params,
              opts: activeResourceOpts,
              updateOpts: this.updateCurrentOpts,
            })
          ])
        ])
      )
    }
  }

  ORGShell.propTypes = {
    store: PropTypes.function.isRequired,
    resources: PropTypes.object.isRequired,
  }

  ORGShell.childContextTypes = {
    locationStream: PropTypes.object,
  }

  return ORGShell
}
