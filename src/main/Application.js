"use strict";

const React = require('react')
    , R = require('ramda')
    , h = require('react-hyperscript')
    , Immutable = require('immutable')
    , { Flex, Box } = require('axs-ui')
    , { DropdownMenu, Breadcrumb } = require('lib/ui')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')
    , { connect } = require('react-redux')
    , locationStream = require('location-hash-stream')()
    , router = require('../router')

const LEFT_CLICK = 1;

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
    const routeStream = router.createStream()

    routeStream.on('data', this.mountResource.bind(this))

    locationStream.pipe(routeStream)
    routeStream.write(window.location.hash || '#')

    document.addEventListener('click', this.handlePageClick.bind(this));
  }

  async mountResource(resource) {
    const { onBeforeRoute=R.always({}), Component, params } = resource
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
      } else {
        setTimeout(() => {
          window.location.hash = redirectTo;
        }, 0)
      }
    } catch (error) {
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

  handlePageClick(e) {
    let anchor = e.target

    const root = location.protocol + '//' + location.host

    do {
      if (!anchor || anchor.nodeName === 'A') break;
    } while ((anchor = anchor.parentNode));

    if (anchor) {
      const url = require('url')
          , href = anchor.href
          , isLeftClick = e.which === LEFT_CLICK && !e.shiftKey && !e.ctrlKey
          , interceptClick = isLeftClick && href && href.indexOf(root) === 0
          , redirect = !anchor.dataset.noRedirect && href !== root + '/'

      if (interceptClick) {
        e.preventDefault();
        if (redirect) {
          locationStream.write(url.parse(href).hash)
        }
      }
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
