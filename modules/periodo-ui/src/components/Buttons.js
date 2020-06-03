"use strict";

const h = require('react-hyperscript')
    , { themeGet } = require('@styled-system/theme-get')
    , { useTheme } = require('emotion-theming')
    , { Box } = require('./Base')

// FIXME: use variants?

function makeButton(color, startShade=5, extra) {
  const shade = n => `${color}.${startShade + n}`

  const gradient = (m, n) => props => `
    linear-gradient(
      to bottom,
      ${themeGet('colors.' + shade(m))(props)} 0%,
      ${themeGet('colors.' + shade(n))(props)} 85%
    )`

  return function (props) {
    const theme = useTheme()

    return (
      h(Box, {
        as: 'button',
        sx: {
          px: 3,
          py: 2,
          border: 1,
          borderColor: shade(3),
          color: 'white',
          fontSize: 1,
          fontWeight: 'bold',
          cursor: 'pointer',
          backgroundImage: gradient(0, 1)({ theme }),
          ':hover': {
            backgroundImage: gradient(1, 2)({ theme }),
          },
          ':disabled': {
            cursor: 'not-allowed',
            opacity: .4,
          },
          ...extra,
        },
        ...props,
      })
    )
  }
}


exports.Button$Primary = makeButton('blue')


exports.Button$Danger = makeButton('red')


exports.Button$Default = exports.Button = makeButton('gray', 0, {
  color: 'black',
})


exports.AriaButton = props =>
  h(Box, {
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
    onClick: props.onSelect,
    ...props,
  }, props.children)
