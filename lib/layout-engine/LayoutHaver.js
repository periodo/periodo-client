"use strict";

const h = require('react-hyperscript')
    , React = require('react')

/*
 * A component with a layout that can be edited, but will not persist across
 * page loads
 */
module.exports = function makeLayoutHaver(Component) {
  return class LayoutHaver extends React.Component {
    constructor(props) {
      super(props)
      this.state = { spec: props.spec }
    }

    render() {
      return h(Component, Object.assign({
        onSpecChange: spec => this.setState({ spec })
      }, this.props, this.state))
    }
  }
}

