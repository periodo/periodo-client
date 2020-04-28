"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { ORGShell, Route } = require('org-shell')
    , { Flex, Pre, Box, Grid, Heading, theme } = require('periodo-ui')
    , { Link } = require('periodo-ui')
    , { Provider } = require('react-redux')
    , { ThemeProvider } = require('styled-components')
    , createStore = require('../store')
    , resources = require('../resources')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')

require('./global_css')

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
          bg: 'gray.0',
          border: 1,
          borderColor: 'gray.4',
        }, groups.map(({ label, routes }, i) =>
          h(Box, {
            key: i,
            minWidth: 200,
            px: 2,
            py: 1,
            css: {
              '& [data-active="true"]::before': {
                content: '"▸"',
                position: 'absolute',
                marginLeft: '-11px',
                color: 'orangered',
              },
            },
          }, [
            h(Heading, {
              key: 'heading' + '-i',
              level: 5,
            }, label),
          ].concat(routes.map(({ route, label }) =>
            h(Link, {
              display: 'block',
              ['data-active']: route.resourceName === activeResource.name,
              key: route.resourceName,
              route,
            }, label)
          )))
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
    return (
      h(ThemeProvider, { theme }, [
        h(Grid, {
          minHeight: '100vh',
          gridTemplateRows: '56px 1fr 116px',
        }, [
          h(Header, {
            bg: 'gray.1',
            borderBottom: '1px solid #ccc',
            showSpinner: this.props.loading,
          }),

          h(Box, {
            bg: this.state.error ? 'red.0' : 'white',
            p: 3,
            m: '0 auto',
            width: '100%',
            maxWidth: 1420,
          }, this.state.error
            ? h(Box, [
              h(Heading, {
                level: '2',
                color: 'red.4',
                css: { 'letterSpacing': '4px' },
              }, 'Client error'),
              h(Heading, {
                level: '4',
                mt: 2,
              }, 'Error stack'),
              h(Pre, this.state.error.err.stack),
              h(Heading, {
                level: '4',
                mt: 2,
              }, 'Component stack'),
              h(Pre, this.state.error.info.componentStack.trim()),
            ])
            : this.state.activeResource && h(MenuedResource, {
              key: this.state.activeResource.name,
              loading: this.props.loading,
              activeResource: this.state.activeResource,
              params: this.props.params,
            }, this.props.children)
          ),

          h(Footer, {
            height: '100%',
            bg: 'gray.1',
            pt: 3,
            px: 3,
            borderTop: '1px solid #ccc',
          }),
        ]),
      ])
    )
  }
}

module.exports = function Shell() {
  const store = createStore()

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

  return (
    h(Provider, { store },
      h(ThemeProvider, { theme },
        h(WrappedApplication)
      )
    )
  )
}
