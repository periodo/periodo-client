"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , Type = require('union-type')
    , { Route } = require('org-shell')
    , { ReactReduxContext, connect } = require('react-redux')
    , { Box, Alert, Link } = require('periodo-ui')
    , { BackendContext, LoadingIcon } = require('periodo-ui')


const ReadyState = Type({
  Pending: {},
  Success: {
    result: R.T,
  },
  Failure: {
    message: String,
  },
})


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
          mb: 2,
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

      render() {
        if (this.state.error) throw this.state.error
        if (this.state.loaded) return h(Component, this.props)

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

module.exports = {
  withBackendContext,
  withLoadProgress,
  withReduxState,
}
