"use strict";

var React = require('react')

module.exports = React.createClass({
  propTypes: {
    name: React.PropTypes.string.isRequired,
    id: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    value: React.PropTypes.string,
    disabled: React.PropTypes.bool,
    handleChange: React.PropTypes.func.isRequired
  },

  render: function () {
    return (
      <div className="form-group">
        <label htmlFor={this.props.id}>{this.props.label}</label>
        <input
            type="text"
            className="form-control"
            id={this.props.id}
            name={this.props.name}
            value={this.props.value}
            disabled={this.props.disabled}
            onChange={this.props.handleChange} />
      </div>
    )
  }
});
