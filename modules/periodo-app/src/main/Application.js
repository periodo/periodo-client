"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { ORGShell, Route } = require('org-shell')
    , { Flex, Pre, Box, Grid, Heading, theme } = require('periodo-ui')
    , { Link } = require('periodo-ui')
    , { connect } = require('react-redux')
    , { ThemeProvider, injectGlobal } = require('styled-components')
    , createStore = require('../store')
    , resources = require('../resources')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')

require('./global_css')

function getRouteGroups(resource, params, props) {
  const hierarchy = resource.hierarchy || resources[''].hierarchy

  try {
    return hierarchy.slice(0, -1).map(group => ({
      label: group.label,
      routes: Object.entries(group.resources).reduce(
        (acc, [routeName, resource]) =>
          (resource.showInMenu || R.T)(props)
            ? [...acc, {
                route: new Route(routeName, params),
                label: resource.label,
              }]
            : acc
      , [])
    }))
  } catch(e) {
    return []
  }
}

class Menu extends React.Component {
  constructor() {
    super();

    this.state = {
      active: null,
      prev: null,
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.active !== this.state.active
  }

  static getDerivedStateFromProps(nextProps, nextState) {
    if (nextProps.loading) return null
    if (!nextProps.storeState) return null

    if (!nextState.active || nextProps.activeResource !== nextState.active.resource) {
      const mappedProps = (
        nextProps.activeResource.mapStateToProps ||
        R.T
      )(nextProps.storeState, { extra: nextProps.extra, params: nextProps.params })

      return {
        active: {
          params: nextProps.params,
          resource: nextProps.activeResource,
          mappedProps,
        },
        prev: nextState.active
      }
    }

    return null
  }

  render() {
    const { active, prev } = this.state

    if (!active) return null;

    const groups = getRouteGroups(active.resource, active.params, active.mappedProps)

    if (prev) {
      const prevGroups = getRouteGroups(prev.resource, prev.params, prev.mappedProps)

      if (R.equals(prevGroups[0], groups[0])) {
        let i = 0

        while (prevGroups.length) {
          const group = prevGroups.shift()

          if (R.equals(group, groups[i])) {
            i++
            continue
          }
          if (groups[i] !== undefined) break

          groups.push(R.merge(group, {
            ghost: true,
          }))

          i++;
        }
      }
    }

    return (
      h(Box, [
        h(Flex, {
          mb: 3,
          py: 2,
          px: 3,
          bg: 'gray.0',
          border: 1,
          borderColor: 'gray.4',
        }, groups.map(({ label, routes, ghost }, i) =>
          h(Box, {
            key: i,
            minWidth: 200,
            px: 2,
            py: 1,
            css: Object.assign({
              '& [data-active="true"]::before': {
                content: '"▸"',
                position: 'absolute',
                marginLeft: '-11px',
                color: 'orangered',
              },
            }, ghost && { opacity: .5 })
          }, [
            h(Heading, { key: 'heading' + '-i', level: 5 }, label),
          ].concat(routes.map(({ route, label }) =>
            h(Link, {
              display: 'block',
              ['data-active']: route.resourceName === active.resource.name,
              key: route.resourceName,
              route,
            }, label)
          )))
        )),

        h(() => {
          this.props.onRendered()
          return null
        }),
      ])
    )
  }
}

Menu = connect(state => ({ storeState: state }))(Menu)

class MenuedResource extends React.Component{
  constructor() {
    super();
    this.state = {
      renderedMenu: false,
    }
  }

  render() {
    const { renderedMenu } = this.state

    return (
      h(Box, [
        h(Menu, {
          loading: this.props.loading,
          activeResource: this.props.activeResource,
          prevResource: this.props.prevResource,
          params: this.props.params,
          extra: this.props.extra,
          onRendered: () => {
            this.setState({ renderedMenu: true })
          },
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
        prevResource: nextState.activeResource,
      }
    }

    return null;
  }

  componentDidCatch(err, info) {
    this.setState({
      error: { err, info }
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
                  }, 'OOPSIE!!!'),
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
                  prevResource: this.state.prevResource,
                  params: this.props.params,
                  extra: this.props.extra,
                }, this.props.children)
          ),

          h(Footer, {
            height: '100%',
            bg: 'gray.1',
            p: 2,
            borderTop: '1px solid #ccc',
          })
        ])
      ])
    )
  }
}

module.exports = ORGShell({
  createStore,
  resources,
  baseTitle: 'PeriodO',
}, PeriodoApplication)
