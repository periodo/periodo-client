"use strict";

const h = require('react-hyperscript')
    , React = require('react')

module.exports = function makeRouterKnower(Component) {
  return class RouterKnower extends React.Component {
    navigateToRoute() {
      const target = this.generateRoute(...arguments)

      window.location.hash = target;
    }

    generateRoute() {
      return require('../../router').generateRoute(...arguments)
    }

    render() {
      const props = Object.assign({}, this.props, {
        generateRoute: this.generateRoute.bind(this),
        navigateToRoute: this.navigateToRoute.bind(this),
      })

      return h(Component, props)
    }
  }
}
