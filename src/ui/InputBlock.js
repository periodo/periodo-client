"use strict";

const h = require('react-hyperscript')
    , RandomID = require('../period_form/RandomID')
    , { Box, Input, Label } = require('axs-ui')

exports.InputBlock = RandomID(({
  name,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  randomID,
}) =>
  h(Box, [
    h(Label, { htmlFor: randomID(name) }, label),
    h(Input, {
      id: randomID(name),
      name,
      value,
      onChange,
      placeholder,
      disabled,
      css: {
        ':disabled': {
          backgroundColor: '#ddd',
          cursor: 'not-allowed',
        }
      }
    })
  ]))
