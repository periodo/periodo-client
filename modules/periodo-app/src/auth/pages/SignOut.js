"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Text, Box } = require('axs-ui')

module.exports = class SignOut extends React.Component {
  componentDidMount() {
    localStorage.removeItem('auth');
    window.periodo.emit('signout');
  }

  render() {
    return (
      h(Box, [
        h(Text, 'You are now logged out')
      ])
    )
  }
}
