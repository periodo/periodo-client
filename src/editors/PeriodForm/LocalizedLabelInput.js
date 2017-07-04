"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , Autosuggest = require('react-autosuggest')
    , languages = require('lib/util/languages').getSortedList()
    , scripts = require('lib/util/scripts').getSortedList()
    , { Input, Flex, Box } = require('axs-ui')
    , { Button$Primary } = require('lib/ui')

const getSuggestions = list => value => {
  const input = value.trim()

  return input.length
    ? list.filter(x => x.name.includes(value))
    : []
}

class Suggestor extends React.Component {
  constructor() {
    super();

    this.state = {
      value: '',
      suggestions: [],
    }
  }

  render() {
    const { value, suggestions } = this.state

    return (
      h(Box, { mr: 1, css: { position: 'relative' }}, [
        h(Autosuggest, {
          suggestions,
          highlightFirstSuggestion: true,
          getSuggestionValue: R.prop('name'),
          onSuggestionsFetchRequested: e => this.setState({
            suggestions: getSuggestions(this.props.items)(e.value)
          }),
          onSuggestionsClearRequested: e => this.setState({
            suggestions: [],
          }),
          theme: {
            suggestionsList: {
              margin: 0,
              padding: 0,
              listStyleType: 'none',
            },

            suggestionsContainerOpen: {
              border: '1px solid #999',
              background: 'white',
              position: 'absolute',
              width: 300,
              maxHeight: 200,
              overflowY: 'auto',
              zIndex: 1,
            },
          },

          renderInputComponent: props => h(Input, props),

          renderSuggestion: (item, { isHighlighted }) =>
            h(Box, Object.assign({
              px: 1,
              py: '6px',
              border: 1,
              borderColor: 'transparent',
              css: {
                borderRadius: 2,
                ':hover': {
                  cursor: 'pointer',
                }
              }
            }, isHighlighted && { bg: '#d2d2d2', borderColor: '#999', }), [
              item.name
            ]),

          inputProps: {
            value,
            onChange: (e, { newValue }) => this.setState({ value: newValue }),
          }
        })
      ])
    )
  }
}

module.exports = ({
  id,
  label={},
  onValueChange,
  handleAddLabel,
  handleRemoveLabel
}) =>
  h(Box, [
    h(Flex, { alignItems: 'center' }, [
      h(Suggestor, {
        items: languages,
      }),

      h(Suggestor, {
        items: scripts,
      }),

      /*
      h(Autocomplete, {
        value: label.script,
        items: scripts.getSortedList(),
        getItemValue: script => script.name,
        onSelect: (str, val) => {
          onValueChange(R.assoc('script', val.code, label))
        },
        renderItem: item => h('div', item.name),
        inputProps: {
          style: {
            marginRight: '2px',
            width: '50px',
            textAlign: 'center',
            cursor: 'pointer',
          }
        }
      }),
      */

      h(Input, {
        id,
        type: 'text',
        value: label.value,
        display: 'inline',
        onChange: e => {
          onValueChange(R.assoc('value', e.target.value, label))
        }
      }),

      handleAddLabel && h(Button$Primary, {
        ml: 1,
        width: 32,
        onClick: handleAddLabel,
      }, '+'),

      handleRemoveLabel && h(Button$Primary, {
        ml: 1,
        width: 32,
        onClick: handleRemoveLabel,
      }, '-'),
    ])
  ])
