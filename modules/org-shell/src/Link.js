"use strict";

const React = require('react')
    , h = React.createElement
    , PropTypes = require('prop-types')
    , { Route } = require('./Route')

module.exports = function makeInternalLink(Component) {
  class ORGShellLink extends React.Component {
    render () {
      const { route, pushState=true } = this.props
          , { locationStream } = this.context

      return (
        h(Component, Object.assign({}, this.props, {
          href: route.url(),
          onClick: e => {
            if (!route) return;
            if (e.ctrlKey || e.shiftKey) return;
            e.preventDefault();

            locationStream.write({ route, pushState, })
          }
        }), this.props.children)
      )
    }
  }

  ORGShellLink.propTypes = {
    route: PropTypes.instanceOf(Route).isRequired,
    pushState: PropTypes.bool,
  }

  ORGShellLink.contextTypes = {
    locationStream: PropTypes.object,
  }

  return ORGShellLink;
}
