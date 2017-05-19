"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , qs = require('querystring')

module.exports = function routerKnower(Component) {
  return React.createClass({
    displayName: 'RouterKnower',

    navigateToRoute() {
      const target = this.generateRoute(...arguments)

      window.location.hash = target;
    },

    generateRoute(routeName, params, queryParams) {
      const { reverse } = require('../../router')

      let path = '#' + reverse(routeName, params)

      if (queryParams) {
        path += '?' + qs.encode(queryParams)
      }

      return path
    },

    render() {
      const props = Object.assign({}, this.props, {
        generateRoute: this.generateRoute,
        navigateToRoute: this.navigateToRoute,
      })

      return h(Component, props)
    }
  })
}
