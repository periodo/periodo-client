"use strict";

const h = require('react-hyperscript')
    , { Input, Textarea, Checkbox } = require('axs-ui')

exports.Input = Input

exports.Checkbox = props => h('input', Object.assign({
  type: 'checkbox',
}, props))
