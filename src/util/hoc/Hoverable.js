"use strict";

const h = require('react-hyperscript')
    , React = require('react')

module.exports = function makeHoverable(Component) {
  return class Hoverable extends React.Component {
    constructor() {
      super();

      this.state = { hovered: false }
    }

    render() {
      return h(Component, Object.assign({}, this.props, this.state, {
        onMouseEnter: () => this.setState({ hovered: true }),
        onMouseLeave: () => this.setState({ hovered: false }),
      }))
    }
  }
}
