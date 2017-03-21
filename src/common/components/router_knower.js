"use strict";

const h = require('react-hyperscript')
    , React = require('react')

module.exports = function routerKnower(Component) {
  return React.createClass({
    displayName: 'RouterKnower',

    contextTypes: {
      router: React.PropTypes.instanceOf(require('route-recognizer')),
      locationBar: React.PropTypes.instanceOf(require('location-bar')),
    },

    navigateToRoute(routeName, params, queryParams) {
      const { locationBar } = this.context
          , target = this.generateRoute(routeName, params, queryParams)

      locationBar.update(target, { trigger: true });
    },

    generateRoute(routeName, params, queryParams) {
      const { router } = this.context

      // TODO
      queryParams;

      return router.generate(routeName, params);
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
