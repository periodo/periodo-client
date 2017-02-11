"use strict";

var React = require('react')
  , Immutable = require('immutable')

const moveCursorToEnd = e => {
  var value = e.target.value
  e.target.value = ''
  e.target.value = value
}

module.exports = React.createClass({
  displayName: 'AutocompleteDropdown',

  propTypes: {
    label: React.PropTypes.string.isRequired,
    initialInput: React.PropTypes.string,
    list: React.PropTypes.instanceOf(Immutable.Iterable).isRequired,
    getter: React.PropTypes.func.isRequired,
    onSelect: React.PropTypes.func.isRequired
  },

  getDefaultProps: function () {
    return { initialInput: '' }
  },

  getInitialState: function () {
    return { matchText: this.props.initialInput, shown: false }
  },

  handleInput: function (e) {
    this.setState({ matchText: e.target.value });
  },

  handleShown: function () {
    this.setState({ matchText: this.props.initialInput, shown: true }, () => {
      var input = React.findDOMNode(this).querySelector('input')
      input.focus();
    });
  },

  handleHidden: function () {
    this.setState({ shown: false });
  },

  handleSelect: function (value) {
    this.refs.dropdown.close();
    this.props.onSelect(value);
  },

  renderMenuItems: function () {
    var AutocompleteResults = require('./autocomplete_results.jsx')

    return [
      <li key="_input" style={{ padding: '1em' }}>
        <input
            value={this.state.matchText}
            onFocus={moveCursorToEnd}
            onChange={this.handleInput}
            className="form-control" />
        <br />
      </li>,

      <li key="_divider" className="divider" />,

      <li>
        <AutocompleteResults
          matchText={this.state.matchText}
          list={this.props.list}
          getter={this.props.getter}
          onSelect={this.handleSelect} />
      </li>
    ]
  },
  render: function () {
    var Dropdown = require('./dropdown.jsx')

    return <Dropdown
      ref="dropdown"
      label={this.props.label}
      renderMenuItems={this.state.shown ? this.renderMenuItems : () => null}
      onShown={this.handleShown}
      onHidden={this.handleHidden} />
  }
});
