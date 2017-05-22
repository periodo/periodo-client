"use strict";

var React = require('react')
  , Immutable = require('immutable')

module.exports = React.createClass({
  displayName: 'AutocompleteDropdown',

  propTypes: {
    label: React.PropTypes.string.isRequired,
    list: React.PropTypes.instanceOf(Immutable.Iterable).isRequired,
    getter: React.PropTypes.func.isRequired,
    onSelect: React.PropTypes.func.isRequired
  },


  getInitialState() {
    return { matchText: '', shown: false }
  },


  handleInput(e) {
    this.setState({ matchText: e.target.value });
  },


  handleShown() {
    this.setState({ matchText: '', shown: true }, () => {
      var input = React.findDOMNode(this).querySelector('input')
      input.focus();
    });
  },


  handleHidden() {
    this.setState({ shown: false });
  },


  handleSelect(value) {
    this.refs.dropdown.close();
    this.props.onSelect(value);
  },


  renderMenuItems() {
    var AutocompleteResults = require('./autocomplete_results.jsx')

    return [
      <li key="_input" style={{ padding: '1em' }}>
        <input
            value={this.state.matchText}
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

  render() {
    var Dropdown = require('./dropdown.jsx')

    return <Dropdown
      ref="dropdown"
      label={this.props.label}
      renderMenuItems={this.state.shown ? this.renderMenuItems : () => null}
      onShown={this.handleShown}
      onHidden={this.handleHidden} />
  }
});
