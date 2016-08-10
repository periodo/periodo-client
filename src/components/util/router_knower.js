"use strict";

const h = require('react-hyperscript')
    , React = require('react')

module.exports = function routerKnower(Component) {
  return React.createClass({
    displayName: 'RouterKnower',

    contextTypes: {
      router: React.PropTypes.instanceOf(require('route-recognizer'))
    },

    render() {
      const { router } = this.context

      return h(Component, Object.assign({ router }, this.props))
    }
  })
}
