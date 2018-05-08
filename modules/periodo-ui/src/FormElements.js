"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , sys = require('system-components').default
    , { themeGet } = require('styled-system')
    , { Box, Input, Label } = require('axs-ui')
    , { Alert$Error } = require('./Alerts')

const disabled = props => ({
  ':disabled': {
    cursor: 'not-allowed',
    backgroundColor: themeGet('colors.gray.3')(props),
    color: 'gray.9',
  }
})

exports.Select = sys({
  is: 'select',
  p: 2,
  bg: 'white',
  borderRadius: '2px',
  border: 1,
  borderColor: 'gray.4',
  width: '100%',
}, disabled)

exports.Textarea = sys({
  is: 'textarea',
  p: 2,
  borderRadius: '2px',
  border: 1,
  borderColor: 'gray.4',
  width: '100%',
}, disabled)

exports.Input = sys({
  is: 'input',
  p: 2,
  borderRadius: '2px',
  border: 1,
  borderColor: 'gray.4',
  width: '100%',
}, disabled)

exports.Checkbox = props => h('input', Object.assign({
  type: 'checkbox',
}, props))

exports.Errors = props =>
  h(Alert$Error, Object.assign({
    mb: 1,
  }, R.omit(['errors'], props)),
    h(Box, { is: 'ul' }, props.errors.map(message =>
      h(Box, { is: 'li' }, message)
    ))
  )

exports.Label = sys({
  is: 'label',
  fontSize: 2,
  color: 'black',
  display: 'inline-block',
  mb: 1,
  fontWeight: 'bold',
}, props => ({
  ':hover': {
    cursor: 'pointer',
  },
  ':after': !props.isRequired ? {} : {
    content: '" \x2a        "',
    color: 'red',
  }
}))
