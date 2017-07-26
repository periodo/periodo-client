"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box, Input, Label } = require('axs-ui')
    , { Alert$Error } = require('./Alerts')

exports.Input = Input

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

exports.Label = props =>
  h(Label, Object.assign({
    fontSize: 4,
    color: 'black',
    mb: '4px',
    css: Object.assign({
      ':hover': {
        cursor: 'pointer',
      },
      fontWeight: 'bold',
    }, props.css, props.isRequired && {
      ':after': {
        content: '" \x2a        "',
        color: 'red',
      }
    })
  }, R.omit(['css', 'isRequired'], props)), props.children)
