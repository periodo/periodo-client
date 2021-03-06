"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , Type = require('union-type')
    , { Route } = require('org-shell')
    , { ReactReduxContext, connect } = require('react-redux')
    , { Box, Alert, Link } = require('periodo-ui')
    , { BackendContext, Breadcrumb, LoadingIcon, NavigationMenu, ClientError } = require('periodo-ui')


const ReadyState = Type({
  Pending: {},
  Success: {
    result: R.T,
  },
  Failure: {
    message: String,
  },
})

function withRenderErrorHandling(Component) {
  class RenderErrorHandling extends React.Component {
    constructor() {
      super()

      this.state = { error: null }
    }

    componentDidCatch(err, info) {
      this.setState({
        error: {
          err,
          info,
        },
      })
    }

    render() {
      if (this.state.error) {
        return (
          h(ClientError, { error: this.state.error })
        )
      }

      return (
        h(Component, this.props)
      )
    }
  }

  return RenderErrorHandling
}


function withBackendContext(Component) {
  function mapStateToProps(state, ownProps) {
    const { backendID } = ownProps.params

    return {
      storagePersisted: state.main.browser.isPersisted,
      backend: state.backends.available[backendID],
      dataset: state.backends.datasets[backendID],
    }
  }

  function BackendKnower(props) {
    let showPersistenceWarning = false

    if (props.backend) {
      showPersistenceWarning = props.backend.storage.case({
        IndexedDB: () => !props.storagePersisted,
        _: () => false,
      })
    }

    return h(BackendContext.Provider, {
      value: {
        dataset: props.dataset,
        backend: props.backend,
      },
    }, [
      !showPersistenceWarning ? null : (
        h(Alert, {
          variant: 'warning',
          width: '100%',
          my: 3,
        }, [
          'Warning: Using local data source without persistent data storage. See the ',
          h(Link, {
            route: new Route('settings'),
          }, 'settings page'),
          ' for details',
        ])
      ),
      h(Component, {
        key: 'component',
        ...props,
      }),
    ])
  }

  return connect(mapStateToProps)(BackendKnower)
}

function withLoadProgress(resource) {
  return Component => {
    if (!resource.loadData) return Component

    class ResourceLoader extends React.Component {
      constructor() {
        super();

        this.state = {
          loaded: false,
          steps: {},
        }

        this.addStep = this.addStep.bind(this)
        this.loadData = this.loadData.bind(this)
      }

      loadData() {
        this.setState({
          loaded: false,
          steps: {},
        })

        const load = Promise.resolve(
          resource.loadData(
            this.props,
            this.addStep,
            () => {
              if (this._unmounted) return
              this.setState({ loaded: true })
            }))

        load.catch(e => {
          this.setState({
            error: e,
          })
        })

        setTimeout(() => {
          if (this._unmounted) return
          this.setState({ showLoading: true })
        }, 50)
      }

      addStep(label, promise) {
        return new Promise((resolve, reject) => {
          if (this._unmounted) return
          this.setState(R.set(
            R.lensPath([ 'steps', label ]),
            {
              label,
              progress: ReadyState.Pending,
            }
          ))

          promise
            .then(result => {
              if (!this._unmounted) {
                this.setState(R.set(
                  R.lensPath([ 'steps', label, 'progress' ]),
                  ReadyState.Success(result)
                ))
              }
              resolve(result)
            })
            .catch(e => {
              if (!this._unmounted) {
                this.setState(R.set(
                  R.lensPath([ 'steps', label, 'progress' ]),
                  ReadyState.Failure(e.message)
                ))
              }
              reject(e)
            })
        })
      }

      componentWillUnmount() {
        this._unmounted = true
      }

      componentDidMount() {
        this.loadData()
      }

      render() {
        if (this.state.error) throw this.state.error

        if (this.state.loaded) {
          return (
            h(Component, {
              reloadData: this.loadData,
              ...this.props,
            })
          )
        }

        if (!this.state.showLoading) return null

        return (
          h(Box, Object.values(this.state.steps).map(({ label, progress }, i) =>
            h('div', {
              key: i,
              style: {
                display: 'grid',
                gridTemplateColumns: 'minmax(auto, 22px) 1fr',
                marginBottom: '.33em',
                fontSize: '16px',
              },
            }, [
              h('div', {}, progress.case({
                Pending: () => h(LoadingIcon),
                Success: () => h('span', {
                  style: {
                    color: 'limegreen',
                    fontWeight: 'bold',
                  },
                }, '✓'),
                Failure: () => h('span', {
                  style: {
                    color: 'red',
                    fontWeight: 'bold',
                  },
                }, '✕'),
              })),

              h('div', label),
            ])
          ))
        )
      }
    }

    return ResourceLoader
  }
}

// FIXME: is this necessary?
function withReduxState(Component) {
  function ReduxStoreComponent(props) {
    return (
      h(ReactReduxContext.Consumer, {}, ({ store }) =>
        h(Component, {
          ...props,
          getState: store.getState,
          dispatch: store.dispatch,
        })
      )
    )
  }

  return ReduxStoreComponent
}

function identity(x) {
  return x
}

function alwaysTrue() {
  return true
}

function getLinkGroups(resource, props) {
  const { hierarchy=[]} = resource
      , groups = []

  hierarchy.slice(0, -1).forEach(group => {
    const linkGroup = {
      label: group.label,
      routes: [],
    }

    Object.entries(group.resources).forEach(([ routeName, resource ]) => {
      const show = (resource.showInMenu || alwaysTrue)(props)

      if (!show) return

      const routeParams = (group.modifyMenuLinkParams || identity)(props.params)

      linkGroup.routes.push({
        label: resource.label,
        route: new Route(routeName, routeParams),
      })
    })

    groups.push(linkGroup)
  })

  return groups
}

function withMenu(resource) {
  return Component => {
    function MenuedComponent(props) {
      const routeGroups = getLinkGroups(resource, props)

      return [
        h(NavigationMenu, {
          key: 'menu',
          activeResource: resource,
          routeGroups,
        }),

        h(Component, {
          key: 'rest',
          ...props,
        }),
      ]
    }

    return MenuedComponent
  }
}

function withBreadcrumb(resource) {
  return Component => {
    function BreadcrumbedComponent(props) {
      let crumbs = null

      if (resource.getBreadcrumbs) {
        crumbs = resource.getBreadcrumbs(props)
      }

      return [
        !crumbs ? null : (
          h(Breadcrumb, {
            key: 'breadcrumb',
            crumbs,
          })
        ),

        h(Component, {
          key: 'rest',
          ...props,
        }),
      ]

    }

    return BreadcrumbedComponent
  }
}

module.exports = {
  withBackendContext,
  withLoadProgress,
  withReduxState,
  withMenu,
  withBreadcrumb,
  withRenderErrorHandling,
}
