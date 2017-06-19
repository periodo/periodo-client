"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box, Input, Textarea, Checkbox } = require('axs-ui')
    , { Alert$Error } = require('./Alerts')

exports.Input = Input

exports.Checkbox = props => h('input', Object.assign({
  type: 'checkbox',
}, props))

exports.Errors = props =>
  h(Alert$Error, R.omit(['errors'], props),
    h(Box, { is: 'ul' }, props.errors.map(message =>
      h(Box, { is: 'li' }, message)
    ))
  )
