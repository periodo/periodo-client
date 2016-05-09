"use strict";

var React = require('react')
  , randomstr = require('../../utils/randomstr')

module.exports = React.createClass({
  displayName: 'Input',

  propTypes: {
    id: React.PropTypes.string,
    name: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    value: React.PropTypes.string,
    disabled: React.PropTypes.bool,
    placeholder: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired
  },


  render() {
    var id = this.props.id || this.props.name + '-' + randomstr()

    return (
      <div className="form-group">
        <label htmlFor={id}>{this.props.label}</label>
        <input
            type="text"
            className="form-control"
            id={id}
            name={this.props.name}
            value={this.props.value}
            placeholder={this.props.placeholder}
            disabled={this.props.disabled}
            onChange={this.props.onChange} />
      </div>
    )
  }
});
