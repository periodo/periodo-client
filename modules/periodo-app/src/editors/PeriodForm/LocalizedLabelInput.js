"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , tags = require('language-tags')
    , { Input, Flex, Box } = require('axs-ui')
    , { Autosuggest, DropdownMenuButton, DropdownMenuMenu, Button } = require('periodo-ui')

class Suggestor extends React.Component {
  constructor() {
    super();

    this.state = {
      editing: false,
    }
  }

  render() {
    const { editing,} = this.state
        , { onSelect, getSuggestions } = this.props

    return (
      h(Box, { css: { position: 'relative' }}, [
        h(DropdownMenuButton, {
          css: {
            position: 'relative',  // Fixes outline overlap for some reason

            whiteSpace: 'nowrap',
            minWidth: 60,
            borderRadius: 0,
            marginRight: '-1px',
          },
          label: this.props.value,
          isOpen: editing,
          onClick: () => this.setState(prev => ({ editing: !prev.editing }))
        }),

        editing && h('div', {
          ref: el => {
            if (el) {
              const input = el.querySelector('input')

              if (input && !input.focused) {
                input.focus();
                input.focused = true;
              }
            }
          }
        }, [
          h(DropdownMenuMenu, { p: 1, width: 600, }, [
            h(Autosuggest, {
              getSuggestions,
              onSelect: (...args) => {
                onSelect(...args);
                this.setState({ editing: false })
              },
              onBlur: () => this.setState({
                editing: false,
              })
            })
          ])
        ])
      ])
    )
  }
}

module.exports = props => {
  const {
    id,
    label,
    languageTag,
    onValueChange,
    handleAddLabel,
    handleRemoveLabel,
  } = props

  let tag = tags(languageTag || 'en')

  if (!tag.valid()) {
    tag = tags('en')
  }

  const lang = tag.language().format()

  let script = (tag.script() || tag.language().script())

  script = script ? script.format() : ''

  return (
    h(Box, R.omit(['id', 'label', 'languageTag', 'onValueChange', 'handleAddLabel', 'handleRemoveLabel'], props), [
      h(Flex, { alignItems: 'center' }, [
        h(Suggestor, {
          getSuggestions: search =>
            tags
              .search(search)
              .reduce((acc=[], subtag) =>
                subtag.type() === 'language'
                  ? [...acc, { subtag, name: subtag.descriptions()[0] }]
                  : acc,
                []
              ),
          value: lang,
          onSelect: ({ subtag }) =>
            onValueChange({
              label,
              languageTag: subtag.format()
            })
        }),

        h(Suggestor, {
          getSuggestions: search =>
            tags
              .search(search)
              .reduce((acc=[], subtag) =>
                subtag.type() === 'script'
                  ? [...acc, { subtag, name: subtag.descriptions()[0] }]
                  : acc,
                []
              ),
          value: script || '(select script)',
          onSelect: ({ subtag }) => {
            // Skip if this is the default script of the current language
            if (tag.language().script() && (
              subtag.format() === tag.language().script().format()
            )) {
              return
            }

            onValueChange({
              label,
              languageTag: `${lang}-${subtag.format()}`
            })
          },
        }),

        h(Input, {
          id,
          type: 'text',
          value: label,
          display: 'inline',
          onChange: e => {
            onValueChange(R.assoc('value', e.target.value, label))
          }
        }),

        handleAddLabel && h(Button, {
          width: 42,
          ml: '-1px',
          borderRadius: 0,
          onClick: handleAddLabel,
        }, '+'),

        handleRemoveLabel && h(Button, {
          width: 42,
          ml: '-1px',
          borderRadius: 0,
          onClick: handleRemoveLabel,
        }, '-'),
      ])
    ])
  )
}
