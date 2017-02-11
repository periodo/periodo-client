"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , fuzzy = require('fuzzy')

const KEYS = {
  UP_ARROW: 38,
  DOWN_ARROW: 40,
  ENTER: 13
}

module.exports = React.createClass({
  displayName: 'AutoCompleteResults',

  propTypes: {
    matchText: React.PropTypes.string.isRequired,
    list: React.PropTypes.instanceOf(Immutable.Iterable).isRequired,
    getter: React.PropTypes.func.isRequired,
    onSelect: React.PropTypes.func.isRequired,
    limit: React.PropTypes.number
  },

  getDefaultProps: function () {
    return { limit: 10 }
  },

  getInitialState: function () {
    return { focused: 0, matches: this.getMatches(this.props.matchText) }
  },

  componentDidMount: function () {
    document.addEventListener('keydown', this.handleKeyDown, false);
  },

  componentWillUnmount: function () {
    document.removeEventListener('keydown', this.handleKeyDown);
  },

  componentWillReceiveProps: function (props) {
    this.setState({
      focused: 0,
      matches: this.getMatches(props.matchText)
    });
  },

  handleKeyDown: function (e) {
    if (e.which === KEYS.UP_ARROW && this.state.focused > 0) {
      this.setState(prev => ({ focused: prev.focused - 1 }));
    } else if (
        e.which === KEYS.DOWN_ARROW &&
        this.state.focused < this.state.matches.size - 1
    ) {
      this.setState(prev => ({ focused: prev.focused + 1 }));
    } else if (e.which === KEYS.ENTER) {
      this.props.onSelect(this.state.matches.get(this.state.focused).original);
    }
  },

  getMatches: function (text) {
    return text
      ? Immutable.List(fuzzy.filter(text, this.props.list, {
          pre: '<strong>',
          post: '</strong>',
          extract: this.props.getter
        })).take(this.props.limit)
      : Immutable.List()
  },

  renderMatch: function (match, i) {
    var className = 'autocomplete-result'
      , key

    if (i === this.state.focused) {
      className += ' autocomplete-result-focused';
    }

    key = match.original instanceof Immutable.Iterable ?
      match.original.hashCode() :
      match.original

    return (
      <li key={key}
          className={className}
          onMouseDown={this.props.onSelect.bind(null, match.original)}>
        <a href="">
          <span dangerouslySetInnerHTML={{ __html: match.string }} />
        </a>
      </li>
    )
  },

  render: function () {
    var matches = this.state.matches;
    return (
      <ul className="list-unstyled">
        {
          !matches.size ?
            <p style={{paddingLeft: '1em'}}>No matches.</p> :
            matches.map(this.renderMatch)
        }
      </ul>
    )
  }
});
