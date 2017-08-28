"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , languages = require('periodo-utils/src/languages').getSortedList()
    , scripts = require('periodo-utils/src/scripts').getSortedList()
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
        , { onSelect, items } = this.props

    return (
      h(Box, { css: { position: 'relative' }}, [
        h(DropdownMenuButton, {
          css: {
            position: 'relative',  // Fixes outline overlap for some reason

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
              onSelect: (...args) => {
                onSelect(...args);
                this.setState({ editing: false })
              },
              items,
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
    label={},
    onValueChange,
    handleAddLabel,
    handleRemoveLabel,
  } = props

  return (
    h(Box, R.omit(['id', 'label', 'onValueChange', 'handleAddLabel', 'handleRemoveLabel'], props), [
      h(Flex, { alignItems: 'center' }, [
        h(Suggestor, {
          items: languages,
          value: label.language,
          onSelect: val => {
            onValueChange(R.assoc('language', val.code.toLowerCase(), label))
          },
        }),

        h(Suggestor, {
          items: scripts,
          value: label.script,
          onSelect: val => {
            onValueChange(R.assoc('script', val.code.toLowerCase(), label))
          },
        }),

        h(Input, {
          id,
          type: 'text',
          value: label.value,
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
