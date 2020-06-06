"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { RandomID } = require('periodo-common')
    , { Box, HelpText } = require('./Base')
    , { Label, Input, Textarea, Select } = require('./FormElements')
    , { Alert } = require('./Alerts')

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
    isRequired=false,
    label,
    helpText,
    options,
    error,
  } = props

  const outerProps = R.omit([
    ...inputProps,
    'randomID',
    'label',
    'helpText',
    'isRequired',
  ], props)

  const formProps = R.pick(inputProps, props)

  return (
    h(Box, outerProps, [
      h(Label, {
        htmlFor: randomID(name),
        isRequired,
      }, label),

      helpText && h(HelpText, helpText),

      h(FormComponent, {
        id: randomID(name),
        ...formProps,
      }, options),

      !error ? null : (
        h(Alert, {
          variant: 'error',
          mt: 2,
        }, [
          error,
        ])
      ),
    ])
  )
})

exports.InputBlock = FormControlBlock(Input)

exports.TextareaBlock = FormControlBlock(Textarea)

exports.SelectBlock = FormControlBlock(Select)
