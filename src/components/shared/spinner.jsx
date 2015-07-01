"use strict";

var React = require('react')
  , Spinner = require('spin.js')

module.exports = React.createClass({
  displayName: 'Spinner',
  getDefaultProps: function () {
    return { spin: false }
  },
  componentDidMount: function () {
    this.spinner = new Spinner({
      lines: 12,
      length: 5,
      width: 2,
      radius: 6,
      trail: 40
    });
    this.refreshSpin();
  },
  componentDidUpdate: function () {
    this.refreshSpin();
  },
  componentWillUnmount: function () {
    this.spinner.stop();
  },
  refreshSpin: function () {
    if (this.props.spin) {
      this.spinner.spin(React.findDOMNode(this));
    } else {
      this.spinner.stop();
    }
  },
  render: function () {
    return <div className="spinner-wrapper" />
  }
});
