"use strict";

const h = require('react-hyperscript')
    , { config, Button } = require('axs-ui')

function makeButton(color, startShade=5, extra) {
  const shade = n => (config.colors[`${color}${startShade + n}`] || 'black')
      , gradient = (m, n) => `linear-gradient(to bottom, ${shade(m)},${shade(n)})`

  const activeStyle = {
    backgroundImage: gradient(1, 2),
  }

  const disabledStyle = {
    opacity: .6,
    cursor: 'not allowed',
  }

  return props => {
    const style = {
      border: `1px solid ${shade(4)}`,
      backgroundImage: gradient(0, 1)
    }

    Object.assign(style, extra)

    if (props.active) Object.assign(style, activeStyle)

    if (props.disabled) Object.assign(style, disabledStyle)

    return h(Button, Object.assign({}, props, {
      css: Object.assign({
        ':disabled': disabledStyle,
        ':active': activeStyle,
        ':hover': {
          border: '1px solid ' + shade(7),
          cursor: 'pointer',
        },
      }, style, props.css),
    }))
  }
}

exports.Button$Primary = makeButton('blue')

exports.Button$Danger = makeButton('red')

exports.Button$Default = exports.Button = makeButton('gray', 0, {
  color: 'black',
})
