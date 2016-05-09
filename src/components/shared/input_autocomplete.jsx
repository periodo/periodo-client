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
    autocompleteLimit: React.PropTypes.number,
    onSelect: React.PropTypes.func.isRequired
  },


  getInitialState() {
    return { autocompleteOpen: false }
  },


  componentDidMount() {
    this.findInput().addEventListener('blur', this.close, false);
    this.findInput().addEventListener('focus', this.open, false);
  },


  componentWillUnmount() {
    this.findInput().removeEventListener('blur', this.close);
    this.findInput().removeEventListener('focus', this.open);
  },


  findInput() {
    return React.findDOMNode(this.refs.input).querySelector('input');
  },


  open() {
    this.setState({ autocompleteOpen: true });
  },


  close() {
    this.setState({ autocompleteOpen: false });
  },


  handleSelect(value) {
    this.props.onSelect(value);
    React.findDOMNode(this.refs.input).querySelector('input').blur();
  },


  render() {
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
          this.state.autocompleteOpen && (
            <ul className="autocomplete-results">
                  <AutocompleteResults
                      matchText={this.props.value}
                      list={this.props.autocompleteFrom}
                      getter={this.props.autocompleteGetter}
                      limit={this.props.autocompleteLimit}
                      onSelect={this.handleSelect} />

            </ul>
          )
        }
      </div>
    )
  }
});
