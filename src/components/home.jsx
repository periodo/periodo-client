"use strict";

var React = require('react')

module.exports = React.createClass({
  componentDidMount: function () {
    var currentBackend = localStorage.currentBackend
      , redirectURL

    redirectURL = currentBackend ?
      this.props.router.generate('backend-home', { backendName: currentBackend }) :
      this.props.router.generate('backend-select')

    if (redirectURL.slice(-1) !== '/') redirectURL += '/';

    this.props.locationBar.update(redirectURL, { replace: true, trigger: true });
  },
  render: function () {
    return <div />
  }
});
