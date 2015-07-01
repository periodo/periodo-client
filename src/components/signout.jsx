"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'SignOut',
  componentDidMount: function () {
    localStorage.removeItem('auth');
    window.periodo.emit('signout');
  },
  render: function () {
    return (
      <h1>You are now logged out.</h1>
    )
  }
});
