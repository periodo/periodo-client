"use strict";

const extend = require('./extend')
    , { config, Button } = require('axs-ui')

function makeButton(color, startShade=5, extra) {
  const normal = config.colors[color + startShade]
      , darker = config.colors[color + (startShade + 1)]
      , darkest = config.colors[color + (startShade + 4)]

  return extend(Button, Object.assign({}, {
    css: {
      ':disabled': {
        opacity: .6,
        cursor: 'not-allowed',
      },

      ':hover': {
        border: '1px solid #555',
        cursor: 'pointer',
      },

      ':focus': {
        backgroundColor: darker
      },

      border: `1px solid ${darkest}`,
      backgroundImage: `linear-gradient(to bottom, ${normal},${darker})`
    },

  }, extra))
}

exports.Button$Primary = makeButton('blue')

exports.Button$Danger = makeButton('red')

exports.Button$Default = exports.Button = makeButton('gray', 0, {
  color: 'black',
})
