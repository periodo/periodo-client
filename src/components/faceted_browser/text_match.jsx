"use strict";

const React = require('react')
    , debounce = require('debounce')
    , h = require('react-hyperscript')

module.exports = React.createClass({
  displayName: 'TextMatch',

  propTypes: {
    onSearchTextChange: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return { text: '' }
  },

  componentWillMount: function () {
    const { onSearchTextChange } = this.props

    this.handleSearch = debounce(() => onSearchTextChange(this.state.text), 250);
  },

  handleChange: function (e) {
    var text = e.target.value;
    this.setState({ text });
    this.handleSearch();
  },

  render: function () {
    return (
      <div>
        <label>
          Match string
          <input
              type="text"
              className="form-control"
              value={this.state.text}
              onChange={this.handleChange} />
        </label>
      </div>
    )
  }
});
