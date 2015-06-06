"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , LocationBar = require('location-bar')

function getBackendAndStore(backendName) {
  var backend;
  return require('./backends').get(backendName)
    .then(_backend => ((backend = _backend), backend.getStore()))
    .then(store => ({ backend, store }))
}

const LEFT_CLICK = 1;

function handlePageClick(e, locationBar) {
  var anchor = e.target
    , root = location.protocol + '//' + location.host

  do {
    if (!anchor || anchor.nodeName === 'A') break;
  } while ((anchor = anchor.parentNode));

  if (anchor) {
    let url = require('url')
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
}

module.exports = React.createClass({
  getInitialState: function () {
    return {
      Component: null,
      backend: null,
      store: null,
      locationBar: null,
      router: null,
      errors: Immutable.List()
    }
  },
  handleRoute: function ({ Component, fetchData }, params) {
    var promise = Promise.resolve({})

    if (params.hasOwnProperty('backendName')) {
      let changeBackend = (
        !this.state.backend ||
        this.state.backend.name !== params.backendName
      )

      if (changeBackend) {
        promise = promise
          .then(() => getBackendAndStore(params.backendName))
          .then(data => ((localStorage.currentBackend = params.backendName), data));
      } else {
        promise = promise.then(() => ({
          backend: this.state.backend,
          store: this.state.store
        }));
      }
    }

    if (fetchData) {
      promise = Promise.all([promise, fetchData()])
        .then(([props, fetchedData]) => {
          props.data = fetchedData;
          return props;
        });
    }

    promise.then(props => {
      this.setState({
        Component,
        backend: props.backend || null,
        store: props.store || null,
        data: props.data || {}
      });
    });
  },
  handleError: function (err) {
    this.setState(prev => {
      prev.loading = false;
      prev.errors.push(err);
      return prev;
    });
  },
  componentDidMount: function () {
    var router = require('./routes')
      , locationBar = new LocationBar()

    locationBar.onChange(path => {
      var match = router.recognize(path);
      if (match) {
        this.handleRoute(match[0].handler, match[0].params);
      } else {
        this.setState({ Component: require('./components/not_found.jsx') });
      }
    });

    document.addEventListener('click', e => {
      handlePageClick(e, locationBar);
    });

    window.periodo.on('request', () => {
      this.setState({ loading: true });
    });

    window.periodo.on('requestEnd', () => {
      this.setState({ loading: false });
    });

    // FIXME: listen for uncaught errors
    window.periodo.handleError = this.handleError;

    locationBar.start();

    this.setState({ locationBar, router });
  },
  render: function () {
    var Application = require('./components/application.jsx');

    return <Application {...this.state} />
  }
});
