"use strict";

const React = require('react')
    , R = require('ramda')
    , h = require('react-hyperscript')
    , through = require('through2')
    , Immutable = require('immutable')
    , { Flex, Box } = require('axs-ui')
    , { DropdownMenu, Breadcrumb } = require('lib/ui')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')
    , { connect } = require('react-redux')
    , router = require('lib/router')

class Application extends React.Component {
  constructor() {
    super();

    this.state = {
      loadingNewPage: true,
      activeComponent: null,
      actions: null,
      breadcrumb: null,
      errors: Immutable.List()
    }
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

    const resource = router.match(path)
        , { onBeforeRoute=R.always({}), Component, params } = resource
        , { dispatch } = this.props

    let redirectTo

    const redirect = url => {
      redirectTo = url;
    }

    this.setState({ loadingNewPage: true })

    try {
      const extraProps = await onBeforeRoute(dispatch, params, redirect)

      const props = Object.assign({}, params, extraProps)

      const actions = (resource.actions || R.always(null))(props)
          , breadcrumb = (resource.breadcrumb || R.always(null))(props)

      if (!redirectTo) {
        if (document) {
          try {
            const title = resource.title(props)
            document.title = 'PeriodO client | ' + title;
          } catch (err) {
            document.title = 'PeriodO client';
          }
        }

        this.setState({
          activeComponent: h(Component, params),
          actions,
          breadcrumb,
        })

        if (pushState) {
          window.history.pushState(undefined, undefined, path);
        }

      } else {
        this.setApplicationPath(redirectTo);
      }
    } catch (error) {
        if (pushState) {
          window.history.pushState(undefined, undefined, path);
        }

      this.setState(prev => ({
        errors: prev.errors.unshift(Immutable.Map({
          error,
          time: new Date()
        }))
      }));

      throw error;
    } finally {
      this.setState({ loadingNewPage: false })
    }
  }

  render() {
    const { activeComponent, errors, loadingNewPage, actions, breadcrumb } = this.state

    return h(Flex, {
      flexDirection: 'column',
      css: {
        height: '100%',
      }
    }, [

      h(Box, {
        is: 'header',
        bg: 'gray2',
        css: {
          flex: 0,
          borderBottom: '1px solid #999',
        }
      }, [
        h(Header, { loadingNewPage }),
      ]),

      h(Box, {
        is: 'main',
        p: 2,
        css: {
          flexGrow: 1,
        }
      }, [
        h(Box, [
          (actions || breadcrumb) && h(Flex, {
            alignItems: 'center',
            mb: 2,
          }, [
            actions && h(DropdownMenu, {
              label: 'Actions'
            }, actions),

            breadcrumb && h(Breadcrumb, {
              mb: 0,
              ml: '-1px',
              css: {
                flexGrow: 1,
                lineHeight: '20px',
                border: '1px solid #bfc5ca',
                borderRadius: '0 2px 2px 0',
              }
            }, breadcrumb),
          ]),

          activeComponent
        ]),
      ]),

      h(Box, {
        bg: 'gray2',
        p: 2,
        css: {
          flex: 0,
          borderTop: '1px solid #999',
        }
      }, [
        h(Footer, { errors })
      ])
    ])
  }
}

module.exports = connect()(Application)
