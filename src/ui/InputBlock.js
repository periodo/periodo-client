"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , RandomID = require('../period_form/RandomID')
    , { Box, Input, Label } = require('axs-ui')

const inputProps = [
  'name',
  'label',
  'value',
  'onChange',
  'placeholder',
  'disabled',
]

exports.InputBlock = RandomID(props => {
  return h(Box, R.omit(inputProps.concat('randomID'), props), [
    h(Label, { htmlFor: props.randomID(props.name) }, props.label),
    h(Input, Object.assign(R.pick(inputProps, props), {
      id: props.randomID(props.name),
      css: {
        ':disabled': {
          backgroundColor: '#ddd',
          cursor: 'not-allowed',
        }
      }
    }))
  ])
})
