"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , consume = require('stream-consume')

module.exports = function makeIgnorer(Component) {
  return class Ignorer extends React.Component {
    componentDidUpdate(prevProps) {
      if (prevProps.stream !== this.props.stream) {
        consume(this.props.stream);
      }
    }

    render() {
      return h(Component, this.props)
    }
  }
}
