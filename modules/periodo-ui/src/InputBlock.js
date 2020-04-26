"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { RandomID } = require('periodo-common')
    , { Box, HelpText } = require('./Base')
    , { Label, Input, Textarea, Select } = require('./FormElements')
    , { Alert$Error } = require('./Alerts')

const inputProps = [
  'name',
  'type',
  'value',
  'onChange',
  'placeholder',
  'disabled',

  'rows',
]

const FormControlBlock = FormComponent => RandomID(props => {
  const {
    randomID,
    name,
    isRequired,
    label,
    helpText,
    options,
    error,
  } = props

  return h(Box,
    R.omit(inputProps.concat(
      'randomID',
      'label',
      'helpText',
      'isRequired'
    ), props),
    [
      h(Label, {
        htmlFor: randomID(name),
        ...(isRequired ? { isRequired: true } : {}),
      }, label),

      helpText && h(HelpText, helpText),

      h(FormComponent, Object.assign(R.pick(inputProps, props), {
        id: randomID(name),
      }), options),

      error
        ? h(Alert$Error, { mt: 2 }, [ error ])
        : null,
    ]
  )
})

exports.InputBlock = FormControlBlock(Input)

exports.TextareaBlock = FormControlBlock(Textarea)

exports.SelectBlock = FormControlBlock(Select)
