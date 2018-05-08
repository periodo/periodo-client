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
  try {
    return resource.hierarchy.slice(0, -1).map(group => ({
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
      )(nextProps.storeState, { params: nextProps.params })

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
      h(Flex, {
        border: 2,
        p: 2,
        mb: 2,
      }, groups.map(({ label, routes, ghost }, i) =>
        h(Box, {
          key: i,
          minWidth: 200,
          css: Object.assign({},
            ghost && {
              opacity: .5,
            }
          )
        }, [
          h(Heading, { key: 'heading' + '-i', level: 5 }, label),
        ].concat(routes.map(({ route, label }) =>
          h(Link, {
            display: 'block',
            key: route.resourceName,
            route,
            css: Object.assign({}, route.resourceName === active.resource.name && {
              backgroundColor: '#ccc',
            }),
          }, label)
        )))
      ))
    )
  }
}

Menu = connect(state => ({ storeState: state }))(Menu)

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
            p: 2,
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
              : h(Box, [
                  this.state.activeResource && h(Menu, {
                    loading: this.props.loading,
                    activeResource: this.state.activeResource,
                    prevResource: this.state.prevResource,
                    params: this.props.params,
                  }),
                  ...[].concat(this.props.children)
              ])
          ),

          h(Footer, {
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
