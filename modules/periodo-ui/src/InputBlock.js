"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { RandomID } = require('periodo-utils').hoc
    , { Box, Input, Textarea, Text } = require('axs-ui')
    , { Label } = require('./FormElements')

const inputProps = [
  'name',
  'value',
  'onChange',
  'placeholder',
  'disabled',

  'rows',
]

const FormControlBlock = FormComponent => RandomID(props =>
  h(Box, R.omit(inputProps.concat('randomID', 'label', 'helpText'), props), [
    h(Label, {
      htmlFor: props.randomID(props.name),
    }, props.label),

    props.helpText && h(Text, {
      size: 1,
      mb: '4px',
    }, props.helpText),

    h(FormComponent, Object.assign(R.pick(inputProps, props), {
      id: props.randomID(props.name),
      css: {
        ':disabled': {
          backgroundColor: '#ddd',
          cursor: 'not-allowed',
        }
      }
    }))
  ]))

exports.InputBlock = FormControlBlock(Input)

exports.TextareaBlock = FormControlBlock(Textarea)