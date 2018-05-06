"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { ORGShell, Route } = require('org-shell')
    , { Flex, Box, Heading } = require('periodo-ui')
    , { Link } = require('periodo-ui')
    , { connect } = require('react-redux')
    , createStore = require('../store')
    , resources = require('../resources')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')

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
          css: Object.assign(
            { minWidth: 200 },
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
      h(Box, {
        css: {
          height: '100%',
        }
      }, [
        h(Header, {
          bg: 'gray1',
          css: {
            height: '56px',
            borderBottom: '1px solid #ccc',
          },
          showSpinner: this.props.loading,
        }),

        h(Box, {
          is: 'main',
        }, [
          h(Box, {
            bg: this.state.error ? 'red' : 'white',
            p: 2,
            css: {
              minHeight: 'calc(100vh - 56px - 116px)',
              margin: 'auto',
              alignSelf: 'stretch',
              flexGrow: 1,
              width: '100%',
              maxWidth: 1420,
            }
          }, this.state.error
              ? h(Box, [
                  h(Heading, {
                    level: '2',
                    color: 'red8',
                    css: { 'letterSpacing': '4px' },
                  }, 'OOPSIE!!!'),
                  h(Heading, {
                    level: '4',
                    mt: 2,
                  }, 'Error stack'),
                  h(Box, {
                    is: 'pre',
                    css: { whiteSpace: 'pre-line' },
                  }, this.state.error.err.stack),
                  h(Heading, {
                    level: '4',
                    mt: 2,
                  }, 'Component stack'),
                  h(Box, {
                    is: 'pre',
                    css: { whiteSpace: 'pre-line' },
                  }, this.state.error.info.componentStack.trim())
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
          )
        ]),

        h(Footer, {
          bg: 'gray1',
          p: 2,
          css: {
            height: '116px',
            borderTop: '1px solid #ccc',
          }
        })
      ])
    )
  }
}

module.exports = ORGShell({
  createStore,
  resources,
  baseTitle: 'PeriodO',
}, PeriodoApplication)
