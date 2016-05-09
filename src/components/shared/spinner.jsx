"use strict";

var React = require('react')
  , Spinner = require('spin.js')

module.exports = React.createClass({
  displayName: 'Spinner',

  getDefaultProps() {
    return { spin: false }
  },

  componentDidMount() {
    this.spinner = new Spinner({
      lines: 12,
      length: 5,
      width: 2,
      radius: 6,
      trail: 40
    });
    this.refreshSpin();
  },

  componentDidUpdate() {
    this.refreshSpin();
  },

  componentWillUnmount() {
    this.spinner.stop();
  },

  refreshSpin() {
    if (this.props.spin) {
      this.spinner.spin(React.findDOMNode(this));
    } else {
      this.spinner.stop();
    }
  },

  render() {
    return <div className="spinner-wrapper" />
  }
});
