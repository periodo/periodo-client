"use strict";

const h = require('react-hyperscript')
    , Autocomplete = require('react-autocomplete')
    , languages = require('lib/util/languages')
    , scripts = require('lib/util/scripts')
    , { Input, Flex } = require('axs-ui')
    , { Button$Primary } = require('lib/ui')

module.exports = ({
  id,
  label,
  onValueChange,
  handleAddLabel,
  handleRemoveLabel
}) =>
  h('div', [
    h(Flex, { alignItems: 'center' }, [
      h(Autocomplete, {
        value: label.get('language'),
        items: languages.getSortedList(),
        getItemValue: language => language.name,
        onSelect: (str, val) => {
          onValueChange(label.set('language', val.code))
        },
        renderItem: language => h('div', language.name),
        inputProps: {
          style: {
            marginRight: '2px',
            width: '50px',
            textAlign: 'center',
            cursor: 'pointer',
          }
        }
      }),

      h(Autocomplete, {
        value: label.get('script'),
        items: scripts.getSortedList(),
        getItemValue: script => script.get('name'),
        onSelect: (str, val) => {
          onValueChange(label.set('script', val.get('code')))
        },
        renderItem: item => h('div', item.get('name')),
        inputProps: {
          style: {
            marginRight: '2px',
            width: '50px',
            textAlign: 'center',
            cursor: 'pointer',
          }
        }
      }),

      h(Input, {
        id,
        type: 'text',
        value: label.get('value'),
        display: 'inline',
        onChange: e => {
          onValueChange(label.set('value', e.target.value))
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
