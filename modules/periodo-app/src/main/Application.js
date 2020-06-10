"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { ORGShell } = require('org-shell')
    , { Provider } = require('react-redux')
    , { ThemeProvider } = require('emotion-theming')
    , { Box, ClientError, Grid, NavigationMenu, theme } = require('periodo-ui')
    , createStore = require('../store')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')
    , IndexedDBMessage = require('./components/IndexedDBMessage')
    , Action = require('./actions')
    , { resources, getRouteGroups } = require('../resources')



class PeriodoApplication extends React.Component {
  constructor() {
    super()

    this.state = {
      error: null,
      activeResource: null,
    }
  }

  static getDerivedStateFromProps(nextProps, nextState) {
    if (nextProps.activeResource !== nextState.activeResource) {
      let menuEl = null

      if (nextProps.activeResource) {
        const routeGroups = getRouteGroups(nextProps.activeResource, nextProps)

        menuEl = h(NavigationMenu, {
          activeResource: nextProps.activeResource,
          routeGroups,
        })
      }

      return {
        error: null,
        activeResource: nextProps.activeResource,
        menuEl,
      }
    }

    return null;
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
    const { showIndexedDBUnsupportedMessage } = this.props
        , { menuEl, error } = this.state

    const children = [ menuEl ]

    if (error) {
      children.push(h(ClientError, { error: this.state.error })
      )
    } else if (showIndexedDBUnsupportedMessage) {
      children.push(h(IndexedDBMessage))
    } else {
      children.push(this.props.children)
    }

    return (
      h(ThemeProvider, { theme }, [
        h(Grid, {
          minHeight: '100vh',
          bg: 'colorsets.page.bg',
          gridTemplateRows: 'auto 1fr auto',
        }, [
          h(Header, {
            showSpinner: this.props.loading,
          }),

          h(Box, {
            px: 3,
            m: '0 auto',
            width: '100%',
            maxWidth: 1420,
          }, children ),

          h(Footer, {
            height: '100%',
            px: 3,
            pt: 3,
          }),
        ]),
      ])
    )
  }
}

class IndexedDBChecker extends React.Component {
  constructor() {
    super();

    this.state = {
      initialized: false,
    }
  }

  async componentDidMount() {
    const { store: { dispatch }} = this.props

    await Promise.allSettled([
      dispatch(Action.InitIndexedDB),
      dispatch(Action.CheckPersistence),
    ])

    this.setState({
      initialized: true,
    })
  }

  render() {
    const { store } = this.props
        , { initialized } = this.state

    if (!initialized) {
      return (
        h(PeriodoApplication)
      )
    }

    const { indexedDBSupported } = store.getState().main.browser

    if (!indexedDBSupported) {
      return (
        h(PeriodoApplication, {
          showIndexedDBUnsupportedMessage: true,
        })
      )
    }

    const WrappedApplication = ORGShell({
      processOpts: {
        serializeValue: val => JSON.stringify(val),
        deserializeValue: val => JSON.parse(val || '{}'),
      },
      extraArgs: {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      resources,
    }, PeriodoApplication)

    return h(WrappedApplication)
  }
}

module.exports = function Shell() {
  const { store, db } = createStore()

  return (
    h(Provider, { store },
      h(ThemeProvider, { theme },
        h(IndexedDBChecker, {
          db,
          store,
        })
      )
    )
  )
}
