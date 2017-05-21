"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , through = require('through2')
    , Immutable = require('immutable')
    , NotFound = require('./components/NotFound')
    , Footer = require('./components/Footer')
    , Header = require('./components/Header')
    , { connect } = require('react-redux')
    , locationHashStream = require('location-hash-stream')
    , { match } = require('../router')

const LEFT_CLICK = 1;

const noop = () => null

const locationStream = locationHashStream()

const Application = React.createClass({
  getInitialState() {
    return {
      loadingNewPage: true,
      activeComponent: null,
      errors: Immutable.List()
    }
  },

  componentDidMount() {
    if (!window.location.hash) {
      window.location.hash = '#/'
    }

    locationStream.pipe(through.obj(async (path, enc, cb) => {
      const m = match(path.slice(1));

      if (m) {
        this.handleRoute(m);
      } else {
        // this.attemptRedirect(path);
        this.setState({ activeComponent: h(NotFound) })
      }

      cb();
    }))

    document.addEventListener('click', this.handlePageClick);
  },

  async handleRoute({ onBeforeRoute=noop, Component, params, queryParams }) {
    const { dispatch } = this.props

    try {
      await onBeforeRoute(dispatch, params, queryParams);
      this.setState({ activeComponent: h(Component) })
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
  },

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
  },


  render() {
    const { activeComponent, errors } = this.state

    return h('div .flex .flex-column', { style: { height: '100%' }}, [
      h('header .flex-none .bg-silver .p2 .border-bottom', [
        h('div .max-width-4 .mx-auto', [
          h(Header)
        ])
      ]),

      h('main .flex-grow .p2', [
        activeComponent
      ]),

      h('footer .flex-none .bg-silver .p2 .border-top', [
        h('div .max-width-4 .mx-auto', [
          h(Footer, { errors })
        ])
      ])
    ])
  }
})

/*
  attemptRedirect(path) {
    const matchKey = 'p0' + path

    if (path.indexOf('/') !== -1) this.showNotFound();

    getBackendAndStore('Canonical')
      .then(({ store }) => {
        if (store.hasIn(['periodCollections', matchKey])) {
          const redirectURL = this.state.router.generate('period-collection-show', {
            backendName: 'Canonical',
            collectionID: encodeURIComponent(matchKey)
          })

          this.state.locationBar.update(redirectURL, { trigger: true })
        } else {
          let collectionID
            , periodID

          store.get('periodCollections').forEach(collection => {
            if (collection.hasIn(['definitions', matchKey])) {
              collectionID = collection.get('id');
              periodID = matchKey;
              return false;
            }
          });

          if (collectionID) {
            let redirectURL = this.state.router.generate('period-collection-show', {
              backendName: 'Canonical',
              collectionID
            });

            redirectURL += '?show_period=' + periodID;
            this.state.locationBar.update(redirectURL, { trigger: true });
          } else {
            this.showNotFound();
          }
        }
      })
  },
*/

module.exports = connect()(Application)
