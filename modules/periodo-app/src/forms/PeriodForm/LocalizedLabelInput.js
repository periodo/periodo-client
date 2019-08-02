"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , tags = require('language-tags')
    , { Input, Flex, Box } = require('periodo-ui')
    , { Autosuggest, DropdownMenuButton, DropdownMenuMenu, Button } = require('periodo-ui')

class Suggestor extends React.Component {
  constructor() {
    super();

    this.state = {
      editing: false,
    }
  }

  render() {
    const { editing } = this.state
        , { onSelect, getSuggestions, buttonCSS } = this.props

    return (
      h(Box, { css: { position: 'relative' }}, [
        h(DropdownMenuButton, {
          css: {
            position: 'relative',  // Fixes outline overlap for some reason

            whiteSpace: 'nowrap',
            minWidth: 60,
            borderRadius: 0,
            marginRight: '-1px',
            ...buttonCSS,
          },
          isOpen: editing,
          onClick: () => this.setState(prev => ({ editing: !prev.editing })),
        }, this.props.value),

        editing && h('div', {
          ref: el => {
            if (el) {
              const input = el.querySelector('input')

              if (input && !input.focused) {
                input.focus();
                input.focused = true;
              }
            }
          },
        }, [
          h(DropdownMenuMenu, {
            p: 1,
            width: 600,
          }, [
            h(Autosuggest, {
              getSuggestions,
              onSelect: (...args) => {
                onSelect(...args);
                this.setState({ editing: false })
              },
              onBlur: () => this.setState({
                editing: false,
              }),
            }),
          ]),
        ]),
      ])
    )
  }
}

module.exports = function LocalizedLabelInput(props) {
  const {
    id,
    label,
    languageTag,
    onValueChange,
    addLabelAfter,
    removeLabelAt,
  } = props

  let tag = tags(languageTag || 'en')

  if (!tag.valid()) {
    tag = tags('en')
  }

  const lang = tag.language()
      , langTag = lang.format()
      , langDefaultScriptTag = lang.script() && lang.script().format()

  const script = (tag.script() || lang.script())
      , scriptTag = script ? script.format() : ''

  const isDefaultScript = scriptTag && scriptTag === langDefaultScriptTag

  return (
    h(Box, R.omit([
      'id',
      'label',
      'languageTag',
      'onValueChange',
      'addLabelAfter',
      'removeLabelAt',
      'removeLabelAt',
    ], props), [
      h(Flex, { alignItems: 'center' }, [
        h(Suggestor, {
          getSuggestions: search =>
            tags
              .search(search)
              .reduce((acc=[], subtag) =>
                subtag.type() === 'language'
                  ? [ ...acc, {
                    subtag,
                    name: subtag.descriptions()[0],
                  }]
                  : acc,
              []
              ),
          value: lang.descriptions()[0],
          onSelect: ({ subtag }) =>
            onValueChange({
              label,
              languageTag: subtag.format(),
            }),
        }),

        h(Suggestor, {
          buttonCSS: isDefaultScript && {
            color: '#999',
          },
          getSuggestions: search =>
            tags
              .search(search)
              .reduce((acc=[], subtag) =>
                subtag.type() === 'script'
                  ? [ ...acc, {
                    subtag,
                    name: subtag.descriptions()[0],
                  }]
                  : acc,
              []
              ),
          value: script ? script.descriptions()[0] : '(select script)',
          onSelect: ({ subtag }) => {
            onValueChange({
              label,
              languageTag: langDefaultScriptTag === subtag.format()
                ? langTag
                : `${lang}-${subtag.format()}`,
            })
          },
        }),

        h(Input, {
          id,
          type: 'text',
          value: label,
          display: 'inline',
          onChange: e => {
            onValueChange({
              label: e.target.value,
              languageTag,
            })
          },
        }),

        addLabelAfter && h(Button, {
          width: 42,
          ml: '-1px',
          borderRadius: 0,
          onClick: addLabelAfter,
        }, '+'),

        removeLabelAt && h(Button, {
          width: 42,
          ml: '-1px',
          borderRadius: 0,
          onClick: removeLabelAt,
        }, '-'),
      ]),
    ])
  )
}
