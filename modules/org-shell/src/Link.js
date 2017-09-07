"use strict";

const React = require('react')
    , h = React.createElement
    , R = require('ramda')
    , PropTypes = require('prop-types')
    , Route = require('./Route')
    , LocationStreamAware = require('./LocationStreamAware')

module.exports = function makeInternalLink(Component) {
  const ORGShellLink = props => {
    const isInternalLink = props.hasOwnProperty('route')
        , childProps = R.omit(['locationStream', 'route', 'pushState'], props)

    if (!isInternalLink) return h(Component, childProps)

    return h(Component, Object.assign({}, childProps, {
      href: props.route.asURL(),
      onClick: e => {
        const { route, pushState, locationStream } = props

        if (e.ctrlKey || e.shiftKey) return;

        e.preventDefault();

        locationStream.write({ route, pushState })
      }
    }), props.children)
  }

  ORGShellLink.propTypes = {
    route: PropTypes.instanceOf(Route),
    pushState: PropTypes.bool,
  }

  return LocationStreamAware(ORGShellLink);
}
