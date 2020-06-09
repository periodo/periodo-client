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
    , blockBG = oc.green[1]
    , secondaryBG = oc.gray[1]

const colors = {
  ...oc,

  // Background for things needing accent:
  // * Hovered/selected rows on a table
  // * All things indicating that they can be clicked
  accent,

  // Background for whole page
  mainBG,

  // Background for header/footer
  secondaryBG,

  // Background for blocks
  blockBG,

  elements: {
    link: oc.blue[5],

    table: {
      header: oc.pink[3],
      body: oc.pink[0],
      hover: accent,
    },
  },
}


module.exports = {
  colors,

  variants: {
    menu: {
      py: 2,
      px: 3,
      my: 3,
      bg: 'gray.0',
      color: 'black',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: 'gray.4',
      '& a[data-active="true"]::before': {
        content: '"▸"',
        position: 'absolute',
        marginTop: '-1px',
        marginLeft: '-11px',
        color: 'orangered',
      },
      '& a': {
        color: 'blue.5',
      },
      '& a[data-active="true"]': {
        color: 'blue.8',
      },
    },
  },

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
