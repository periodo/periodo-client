"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , Autocomplete = require('react-autocomplete')
    , languages = require('lib/util/languages')
    , scripts = require('lib/util/scripts')
    , { Input, Flex, Box } = require('axs-ui')
    , { Button$Primary } = require('lib/ui')


module.exports = ({
  id,
  label={},
  onValueChange,
  handleAddLabel,
  handleRemoveLabel
}) =>
  h(Box, [
    h(Flex, { alignItems: 'center' }, [
      h(Autocomplete, {
        value: label.language,
        items: languages.getSortedList(),
        getItemValue: language => language.name,
        onSelect: (str, val) => {
          onValueChange(R.assoc('language', val.code, label))
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
