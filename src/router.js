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

module.exports = React.createClass({
  getInitialState: function () {
    return {
      Component: null,
      router: null,
      backend: null,
      store: null,
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
        promise = promise.then(() => getBackendAndStore(params.backendName))
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
        router: props.router || null,
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
        this.setState({ component: <h2>Page not found</h2> });
      }
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
  },
  render: function () {
    var Application = require('./components/application.jsx');

    return <Application {...this.state} />
  }
});
