"use strict";

const extend = require('./extend')
    , { config, Button } = require('axs-ui')

function makeButton(color, startShade=6, extra) {
  const normal = config.colors[color + startShade]
      , darker = config.colors[color + (startShade + 2)]

  return extend(Button, Object.assign({}, {
    css: {
      ':disabled': {
        opacity: .6,
        cursor: 'not-allowed',
      },

      ':hover': {
        backgroundColor: darker
      },

      ':focus': {
        backgroundColor: darker
      }
    },

    bg: normal
  }, extra))
}

exports.Button$Primary = makeButton('blue')

exports.Button$Danger = makeButton('red')

exports.Button$Default = exports.Button = makeButton('gray', 2, {
  color: 'black',
})
