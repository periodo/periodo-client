"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'Input',

  propTypes: {
    id: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    value: React.PropTypes.string,
    disabled: React.PropTypes.bool,
    placeholder: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired
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
            placeholder={this.props.placeholder}
            disabled={this.props.disabled}
            onChange={this.props.onChange} />
      </div>
    )
  }
});
