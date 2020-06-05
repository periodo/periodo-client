"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { ORGShell, Route } = require('org-shell')
    , { Flex, Pre, Box, Grid, Heading, Section, SectionHeading, theme } = require('periodo-ui')
    , { Link } = require('periodo-ui')
    , { Provider } = require('react-redux')
    , { ThemeProvider } = require('emotion-theming')
    , createStore = require('../store')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')
    , Action = require('./actions')
    , resources = require('../resources')

/*
require('./global_css')
*/

function getRouteGroups(resource, props) {
  const hierarchy = resource.hierarchy || resources[''].hierarchy

  try {
    return hierarchy.slice(0, -1).map(group => ({
      label: group.label,
      routes: Object.entries(group.resources).reduce(
        (acc, [ routeName, resource ]) =>
          (resource.showInMenu || R.T)(props)
            ? [ ...acc, {
              route: new Route(
                routeName,
                (group.modifyMenuLinkParams || R.identity)(props.params)
              ),
              label: resource.label,
            }]
            : acc
        , []),
    }))
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e)
    return []
  }
}

class Menu extends React.Component {
  constructor() {
    super();

    this.state = {
      active: null,
    }
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.activeResource !== this.props.activeResource
  }

  componentDidMount() {
  }

  render() {
    const { activeResource, params } = this.props

    if (!activeResource) return null;

    const groups = getRouteGroups(activeResource, { params })

    return (
      h(Box, [
        h(Flex, {
          mb: 3,
          py: 2,
          px: 3,
          bg: 'white',
        }, groups.map(({ label, routes }, i) =>
          h(Box, {
            key: i,
            minWidth: 180,
            px: 2,
            py: 1,
            css: {
              '& [data-active="true"]::before': {
                content: '"▸"',
                position: 'absolute',
                marginTop: '-1px',
                marginLeft: '-11px',
                color: 'orangered',
              },
            },
          }, [
            h(Heading, {
              key: 'heading' + '-i',
              level: 2,
              fontSize: 2,
            }, label),
          ].concat(routes.map(({ route, label }) => {
            const isActive = route.resourceName === activeResource.name
            return h(Link, {
              display: 'block',
              ['data-active']: isActive,
              color: `blue.${ isActive ? 8 : 4 }`,
              key: route.resourceName,
              route,
            }, label)
          })))
        )),
      ])
    )
  }
}

class MenuedResource extends React.Component{
  constructor() {
    super();

    this.state = {
      renderedMenu: true,
    }
  }

  render() {
    const { renderedMenu } = this.state

    return (
      h(Box, [
        h(Menu, {
          loading: this.props.loading,
          activeResource: this.props.activeResource,
          params: this.props.params,
        }),

        renderedMenu ? h(Box, {}, this.props.children) : null,
      ])
    )
  }
}

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
      return {
        error: null,
        activeResource: nextProps.activeResource,
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

    let mainEl

    if (this.state.error) {
      mainEl = (
        h(Box, [
          h(Heading, {
            level: '2',
            color: 'red.4',
            css: { 'letterSpacing': '4px' },
          }, 'Client error'),
          h(Box, {
            my: 2,
            style: {
              fontWeight: 'bold',
              fontSize: '16px',
            },
          }, [
            this.state.error.err.toString(),
          ]),
          h(Heading, {
            level: '4',
            mt: 2,
          }, 'Error stack'),
          h(Pre, {
            ml: 2,
          }, [
            this.state.error.err.stack,
          ]),
          h(Heading, {
            level: '4',
            mt: 2,
          }, 'Component stack'),
          h(Pre, this.state.error.info.componentStack.trim()),
        ])
      )
    } else if (showIndexedDBUnsupportedMessage) {
      mainEl = (
        h(Box, [
          h(SectionHeading, 'Browser incompatible'),
          h(Section, [
            h(Box, {
              as: 'p',
              mb: 3,
            }, [
              'Your browser does not support the ',
              h('a', {
                href: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API',
              }, 'IndexedDB'),
              ' standard, which PeriodO requires to operate. The most recent versions of all major Web browsers (Firefox, Safari, Chrome, Opera) all support IndexedDB. Please try another browser and reopen PeriodO.',
            ]),

            h(Box, {
              as: 'p',
              mb: 3,
            }, [
              '(Note: if you have opened PeriodO in a "private" or "incognito" tab, IndexedDB may not be available. If that is the case, reopen PeriodO in a normal tab).',
            ]),
          ]),
        ])
      )
    } else {
      mainEl = this.state.activeResource && h(MenuedResource, {
        key: this.state.activeResource.name,
        loading: this.props.loading,
        activeResource: this.state.activeResource,
        params: this.props.params,
      }, this.props.children)
    }

    return (
      h(ThemeProvider, { theme }, [
        h(Grid, {
          minHeight: '100vh',
          bg: 'gray.3',
          gridTemplateRows: '56px 1fr 116px',
        }, [
          h(Header, {
            showSpinner: this.props.loading,
          }),

          h(Box, {
            px: 3,
            m: '0 auto',
            width: '100%',
            maxWidth: 1420,
          }, mainEl ),

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
