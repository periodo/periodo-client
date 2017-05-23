"use strict";

const extend = require('./extend')
    , { Button, config } = require('axs-ui')

exports.PrimaryButton = extend(Button, {
  css: {
    ':disabled': {
      opacity: .6,
      cursor: 'not-allowed',
    }
  }
})
