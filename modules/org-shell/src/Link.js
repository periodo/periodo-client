"use strict";

const React = require('react')
    , h = React.createElement
    , PropTypes = require('prop-types')
    , Route = require('./Route')
    , LocationStreamAware = require('./LocationStreamAware')

module.exports = function makeInternalLink(Component) {
  const ORGShellLink = props =>
    h(Component, Object.assign({}, props, {
      href: props.route.url(),
      onClick: e => {
        const { route, pushState=true, locationStream } = this.props

        if (!route) return;

        if (e.ctrlKey || e.shiftKey) return;

        e.preventDefault();

        locationStream.write({ route, pushState, })
      }
    }), props.children)

  ORGShellLink.propTypes = {
    route: PropTypes.instanceOf(Route).isRequired,
    pushState: PropTypes.bool,
  }

  return LocationStreamAware(ORGShellLink);
}
