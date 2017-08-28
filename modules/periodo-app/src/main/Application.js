"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , R = require('ramda')
    , querystring = require('querystring')
    , through = require('through2')
    , Immutable = require('immutable')
    , { Box, Flex } = require('axs-ui')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')
    , { connect } = require('react-redux')
    , router = require('periodo-router')

class Application extends React.Component {
  constructor() {
    super();

    this.state = {
      first: true,
      loadingNewPage: true,
      activeResource: null,
      activeResourceOpts: {},
      errors: Immutable.List(),
    }

    this.updateCurrentOpts = this.updateCurrentOpts.bind(this);
  }

  componentDidMount() {
    global.PeriodO = {}
    global.PeriodO.locationStream = through.obj()

    window.onpopstate = () => {
      global.PeriodO.locationStream.write({
        path: window.location.search,
      })
    }

    window.PeriodO.locationStream
      .on('data', ({ path, pushState }) => {
        this.setApplicationPath(path, pushState)
      })
      .on('error', e => {
        throw e;
      })
      .write({
        path: window.location.search
      })
  }

  async setApplicationPath(path, pushState) {
    if (path instanceof router.Route) {
      path = path.url()
    }

    let redirectTo

    const resource = router.match(path)
        , { onBeforeRoute, params } = resource
        , { dispatch } = this.props
        , redirect = url => redirectTo = url

    this.setState({ loadingNewPage: true })

    try {
      if (onBeforeRoute) {
        await onBeforeRoute(dispatch, params, redirect)
      }

      if (redirectTo) {
        this.setApplicationPath(redirectTo);
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
            Component: () => h('div', [
              h('h1', 'Error while loading resource: ' + resource.params.page),
              h('pre', {}, err.stack || err),
            ])
          },
          activeResourceOpts: null,
        })

    } finally {
      this.setState({ loadingNewPage: false })
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
    const { loadingNewPage, activeResource, activeResourceOpts } = this.state

    return h(Box, {
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
        showSpinner: loadingNewPage,
      }),

      h(Box, {
        is: 'main',
      }, [
        h(Box, {
          bg: 'white',
          p: 2,
          css: {
            minHeight: 'calc(100vh - 56px - 116px)',
            margin: 'auto',
            alignSelf: 'stretch',
            flexGrow: 1,
            width: '100%',
            maxWidth: 1420,
          }
        }, [
          activeResource && h(activeResource.Component, {
            params: activeResource.params,
            opts: activeResourceOpts
              ? typeof activeResourceOpts === 'object'
                ? activeResourceOpts
                : JSON.parse(activeResourceOpts)
              : {},
            updateOpts: this.updateCurrentOpts,
          })
        ])
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
  }
}

module.exports = connect()(Application)
