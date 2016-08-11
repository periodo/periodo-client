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

    navigateTo(routeName, params, queryParams) {
      const { router, locationBar } = this.context
          , target = router.generate(routeName, params);

      locationBar.update(target, { trigger: true });
    },

    render() {
      const props = Object.assign({ navigateTo: this.navigateTo }, this.props)

      return h(Component, props)
    }
  })
}
