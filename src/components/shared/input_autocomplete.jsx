"use strict";

var React = require('react')
  , Immutable = require('immutable')

module.exports = React.createClass({
  displayName: 'InputAutocomplete',

  propTypes: {
    /* Same as Input */
    id: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    value: React.PropTypes.string,
    disabled: React.PropTypes.bool,
    placeholder: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired,

    /* For autocomplete */
    autocompleteFrom: React.PropTypes.instanceOf(Immutable.Iterable).isRequired,
    autocompleteGetter: React.PropTypes.func.isRequired,
    autocompleteLimit: React.PropTypes.number.isRequired,
    onSelect: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return { autocompleteOpen: false }
  },

  componentDidMount: function () {
    this.findInput().addEventListener('blur', this.close, false);
    this.findInput().addEventListener('focus', this.open, false);
  },

  componentWillUnmount: function () {
    this.findInput().removeEventListener('blur', this.close);
    this.findInput().removeEventListener('focus', this.open);
  },

  findInput: function () {
    return React.findDOMNode(this.refs.input).querySelector('input');
  },

  open: function () {
    this.setState({ autocompleteOpen: true });
  },

  close: function () {
    this.setState({ autocompleteOpen: false });
  },

  render: function () {
    var Input = require('./input.jsx')
      , AutocompleteResults = require('../shared/autocomplete_results.jsx')

    return (
      <div>
        <Input
            ref="input"
            id={this.props.id}
            name={this.props.name}
            label={this.props.label}
            placeholder={this.props.placeholder}
            value={this.props.value}
            onChange={this.props.onChange} />
        {
          !this.state.autocompleteOpen ? null :
          <ul className="autocomplete-results">
                <AutocompleteResults
                    matchText={this.props.value}
                    list={this.props.autocompleteFrom}
                    getter={this.props.autocompleteGetter}
                    limit={this.props.autocompleteLimit}
                    onSelect={this.props.onSelect} />

          </ul>
        }
      </div>
    )
  }
});
