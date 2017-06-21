"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , Immutable = require('immutable')
    , { Flex, Box } = require('axs-ui')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')
    , { connect } = require('react-redux')
    , locationStream = require('location-hash-stream')()
    , router = require('../router')

const LEFT_CLICK = 1;

const noop = () => null

class Application extends React.Component {
  constructor() {
    super();

    this.state = {
      loadingNewPage: true,
      activeComponent: null,
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
    const { onBeforeRoute=noop, Component, params } = resource
        , { dispatch } = this.props

    let redirectTo

    const redirect = url => {
      redirectTo = url;
    }

    this.setState({ loadingNewPage: true })

    try {
      await onBeforeRoute(dispatch, params, redirect);

      if (!redirectTo) {
        this.setState({
          activeComponent: h(Component, params)
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
    const { activeComponent, errors } = this.state

    return h(Flex, {
      flexDirection: 'column',
      css: {
        height: '100%',
      }
    }, [
      h(Box, {
        is: 'header',
        bg: 'gray2',
        p: 2,
        css: {
          flex: 0,
          borderBottom: '1px solid #999',
        }
      }, [
        h(Header)
      ]),

      h(Box, {
        is: 'main',
        p: 2,
        css: {
          flexGrow: 1,
        }
      }, [
        activeComponent
      ]),

      h(Box, {
        bg: 'gray2',
        p: 2,
        css: {
          flex: 0,
          borderTop: '1px solid #999',
        }
      }, [
        h(Box, {
          mx: 'auto',
          css: {
            maxWidth: 4,
          }
        }, [
          h(Footer, { errors })
        ])
      ])
    ])
  }
}

module.exports = connect()(Application)
