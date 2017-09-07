"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { config, Box, Button } = require('axs-ui')

function makeButton(color, startShade=5, extra) {
  const shade = n => (config.colors[`${color}${startShade + n}`] || 'black')
      , gradient = (m, n) => `linear-gradient(to bottom, ${shade(m)},${shade(n)})`

  const activeStyle = {
    backgroundImage: gradient(1, 2),
  }

  const disabledStyle = {
    opacity: .4,
  }

  return props => {
    const style = {
      border: `1px solid ${shade(4)}`,
      backgroundImage: gradient(0, 1)
    }

    Object.assign(style, extra)

    if (props.active) {
      Object.assign(style, activeStyle)
    }

    if (props.is && props.is !== 'button') {
      props = R.omit(['active'], props)
    }

    if (props.disabled) Object.assign(style, disabledStyle)


    return h(Button, Object.assign({}, props, {
      css: Object.assign({
        ':disabled': disabledStyle,
        ':active:not(:disabled)': activeStyle,
        ':hover:not(:disabled)': {
          border: '1px solid ' + shade(7),
          cursor: 'pointer',
        },
        ':hover:disabled': {
          cursor: 'not-allowed',
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


exports.AriaButton = props =>
  h(Box, Object.assign({
    is: 'span',
    role: 'button',
    tabIndex: 0,
    onKeyPress: e => {
      if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    onKeyUp: e => {
      if (e.key === 'Enter' || e.key === ' ') {
        props.onSelect();
      }
    },
    onClick: props.onSelect
  }, props), props.children)
