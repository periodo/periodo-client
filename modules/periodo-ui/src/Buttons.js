"use strict";

const h = require('react-hyperscript')
    , sys = require('system-components').default
    , { themeGet } = require('styled-system')
    , { Box } = require('./Base')

function makeButton(color, startShade=5, extra) {
  const shade = n => `${color}.${startShade + n}`

  const gradient = (m, n) => props => `
    linear-gradient(
      to bottom,
      ${themeGet('colors.' + shade(m))(props)} 0%,
      ${themeGet('colors.' + shade(n))(props)} 85%
    )`

  return sys({
    is: 'button',
    px: 3,
    py: 2,
    border: 1,
    borderColor: shade(3),
    color: 'white',
    fontSize: 1,
    fontWeight: 'bold',
  }, 'position',
  props => ({
    cursor: 'pointer',
    backgroundImage: gradient(0, 1)(props),
    ':hover': {
      backgroundImage: gradient(1, 2)(props),
    },
    ':disabled': {
      cursor: 'not-allowed',
      opacity: .4,
    },
    ...extra,
  })
  )
}


exports.Button$Primary = makeButton('blue')


exports.Button$Danger = makeButton('red')


exports.Button$Default = exports.Button = makeButton('gray', 0, {
  color: 'black',
})


const AriaButton = ({ css, ...props }) =>
  h(Box, {
    is: 'span',
    role: 'button',
    tabIndex: 0,
    css: {
      cursor: 'pointer',
      ...css,
    },
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
    onClick: props.onSelect,
    ...props,
  }, props.children)

exports.AriaButton = AriaButton

exports.LinkButton = props =>
  h(AriaButton, {
    color: 'blue.5',
    display: 'inline-block',
    px: 2,
    py: 1,
    css: {
      ':hover': { textDecoration: 'underline' },
    },
    ...props,
  })
