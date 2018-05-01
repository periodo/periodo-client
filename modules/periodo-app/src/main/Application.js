"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { ORGShell } = require('org-shell')
    , { Box, Heading } = require('axs-ui')
    , createStore = require('../store')
    , resources = require('../resources')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')

class PeriodoApplication extends React.Component {
  constructor() {
    super()

    this.state = {
      error: null
    }
  }

  static getDerivedStateFromProps(nextProps, nextState) {
    const state = {
      resourceName: nextProps.activeResourceName
    }

    if (nextProps.activeResourceName !== nextState.resourceName) {
      return Object.assign({ error: null }, state)
    }

    return state;
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
          showSpinner: this.props.loadingNewResource,
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
              : this.props.children)
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
