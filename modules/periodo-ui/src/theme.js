"use strict";

const oc = require('open-color')
    , { themeGet } = require('@styled-system/theme-get')

const gradient = (color, m, n) => theme => {
  themeGet
  const x = `
    linear-gradient(
      to bottom,
      ${themeGet(`colors.${color}.${m}`)({ theme })} 0%,
      ${themeGet(`colors.${color}.${n}`)({ theme })} 85%
    )`
  return x
}

const mainBG = oc.blue[0]
    , accent = oc.green[2]
    , blockBG = 'white'
    , secondaryBG = oc.gray[2]

const colors = {
  ...oc,

  accent,
  mainBG,
  secondaryBG,
  blockBG,

  elements: {
    table: {
      header: oc.gray[4],
      body: 'white',
      hover: accent,
    },
  },
}


module.exports = {
  colors,

  buttons: {
    default: {
      color: 'black',
      backgroundImage: gradient('gray', 1, 2),
      ':hover:not(:disabled)': {
        backgroundImage: gradient('gray', 3, 4),
      },
      borderColor: 'gray.4',
    },

    primary: {
      color: 'white',
      backgroundImage: gradient('blue', 6, 7),
      ':hover:not(:disabled)': {
        backgroundImage: gradient('blue', 8, 9),
      },
      borderColor: 'blue.9',
    },

    danger: {
      color: 'white',
      backgroundImage: gradient('red', 6, 7),
      ':hover:not(:disabled)': {
        backgroundImage: gradient('red', 8, 9),
      },
      borderColor: 'red.9',
    },
  },

  alerts: {
    success: {
      bg: 'green.2',
      color: 'green.9',
      borderColor: 'green.6',
    },

    warning: {
      bg: 'yellow.2',
      color: 'yellow.9',
      borderColor: 'yellow.6',
    },

    error: {
      bg: 'red.2',
      color: 'red.9',
      borderColor: 'red.6',
    },
  },
}
