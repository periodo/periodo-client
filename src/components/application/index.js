"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , NotFound = require('./not_found')
    , Footer = require('./footer')
    , Header = require('./header')

const LEFT_CLICK = 1;


module.exports = React.createClass({
  displayName: 'Application',

  getInitialState() {
    return {
      activeComponent: null
    }
  },

  componentDidMount() {
    const { router, locationBar } = this.props

    document.addEventListener('click', this.handlePageClick.bind(null, locationBar));

    locationBar.onChange(path => {
      const match = router.recognize(path);

      if (match) {
        this.handleRoute(match[0].handler, match[0].params);
      } else {
        // this.attemptRedirect(path);
        this.setState({ activeComponent: h(NotFound) })
      }
    });

    locationBar.start();
  },

  handleRoute({ Component, opts={} }, params) {
    params;

    this.setState({ activeComponent: h(Component) })
  },

  handlePageClick(locationBar, e) {
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
          locationBar.update(url.parse(href).hash, { trigger: true });
        }
      }
    }
  },


  render() {
    const { activeComponent } = this.state

    return h('div .flex .flex-column', { style: { height: '100%' }}, [
      h('header .bg-silver .p2 .border-bottom', [
        h('div .max-width-4 .mx-auto', [
          h(Header)
        ])
      ]),
      h('main .flex-auto .p2', [
        activeComponent
      ]),
      h('footer .bg-silver .p2 .border-top', [
        h('div .max-width-4 .mx-auto', [
          h(Footer)
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