"use strict";

var React = require('react')
  , Immutable = require('immutable')

module.exports = React.createClass({
  displayName: 'AutocompleteDropdown',

  propTypes: {
    label: React.PropTypes.string.isRequired,
    getMatchingItems: React.PropTypes.func.isRequired,
    renderMatch: React.PropTypes.func.isRequired,
    onSelect: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return { matchingText: '' }
  },
  handleInput: function (e) {
    this.setState({ matchingText: e.target.value });
  },
  handleShown: function () {
    var input = React.findDOMNode(this).querySelector('input')
    input.focus();
  },
  getMatchingLanguages: function () {
    var languages = require('../../utils/languages')

    if (this.state.matchingText) {
      let matchingSet = Immutable.Set(this.state.matchingText);
      languages = languages
        .filter(lang => matchingSet.subtract(Immutable.Set(lang.get('name'))).size === 0)
    } else {
      languages = languages
        .filter(lang => lang.get('iso6391'))
        .sortBy(lang => lang.get('name'))
    }

    return languages.take(10);
  },
  renderMenuItems: function () {
    var matches = this.props.getMatchingItems(this.state.matchingText);
    return [
        <li key="_input" style={{ padding: '1em' }}>
          <input onChange={this.handleInput} className="form-control" />
          <br />
        </li>,
        <li key="_divider" className="divider" />,

        !matches.size ?
          <p key="_no_matches">No matches</p> :
          matches.map(match =>
            <li onClick={this.props.onSelect.bind(null, match)} key={match.hashCode()}>
              <a href="">{this.props.renderMatch(match)}</a>
            </li>)
    ]
  },
  render: function () {
    var Dropdown = require('./dropdown.jsx')

    return <Dropdown
      label={this.props.label}
      renderMenuItems={this.renderMenuItems}
      onShown={this.handleShown} />
  }
});
