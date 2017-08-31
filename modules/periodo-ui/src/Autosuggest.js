"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , Autosuggest = require('react-autosuggest')
    , { Box, Input } = require('axs-ui')

const getSuggestions = list => value => {
  const input = value.trim()

  return input.length
    ? list.filter(x => x.name.includes(value))
    : []
}

exports.Autosuggest = class _Autosuggest extends React.Component {
  constructor() {
    super();

    this.state = {
      value: '',
      suggestions: [],
    }
  }

  render() {
    const { value, suggestions } = this.state
        , { onSelect, items } = this.props

    const autoSuggestProps = R.omit([
      'onSelect',
      'items',
      'onBlur',
      'inputProps',
      'theme',
    ], this.props)

    return (
      h(Autosuggest, Object.assign({
        suggestions,
        highlightFirstSuggestion: true,
        focusInputOnSuggestionClick: false,
        getSuggestionValue: R.prop('name'),
        onSuggestionsFetchRequested: e => this.setState({
          suggestions: getSuggestions(items)(e.value)
        }),
        onSuggestionsClearRequested: () => this.setState({
          suggestions: [],
        }),
        onSuggestionSelected: (e, { suggestion }) => {
          onSelect(suggestion);

          this.setState({
            suggestions: [],
            value: ''
          })
        },
        theme: Object.assign({
          suggestionsList: {
            margin: 0,
            padding: 0,
            listStyleType: 'none',
          },

          suggestionsContainerOpen: Object.assign({
            marginTop: '4px',
            background: 'white',
            height: 200,
            overflowY: 'scroll',
            zIndex: 1,
          }, R.path(['theme', 'suggestionsContainerOpen'], this.props)),
        }, R.omit(['suggestionsContainerOpen'], this.props.theme)),

        renderInputComponent: props => h(Input, props),

        renderSuggestion: (item, { isHighlighted }) =>
          h(Box, Object.assign({
            px: 1,
            py: '6px',
            border: 1,
            borderColor: 'transparent',
            css: {
              borderRadius: 1,
              ':hover': {
                cursor: 'pointer',
              }
            }
          }, isHighlighted && { bg: 'gray2' }), [
            item.name
          ]),

        inputProps: Object.assign({
          value,
          placeholder: 'Begin typing to search',
          onChange: (e, { newValue }) => this.setState({ value: newValue }),
          onBlur: () => {
            this.setState({
              suggestions: [],
              value: ''
            })

            // lol
            if (this.props.onBlur) {
              this.props.onBlur();
            }
          }
        }, R.omit(['onBlur'], this.props.inputProps))
      }, autoSuggestProps))
    )
  }
}