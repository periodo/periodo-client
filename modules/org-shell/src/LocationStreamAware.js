"use strict";

const React = require('react')
    , h = React.createElement
    , PropTypes = require('prop-types')

module.exports = function makeLocationStreamAware(Component) {
  class LocationStreamAware extends React.Component {
    render () {
      const { locationStream } = this.context

      return h(Component, Object.assign({ locationStream }, this.props))
    }
  }

  LocationStreamAware.contextTypes = {
    locationStream: PropTypes.object,
  }

  return LocationStreamAware;
}
