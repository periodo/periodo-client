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

const colors = {
  ...oc,

  colorsets: {
    // Entire page
    page: {
      bg: 'hsla(45,31%,93%,1)',
      // bg: oc.gray[0],
      fg: 'black',
      border: oc.gray[3],
    },

    // Headers and footers
    bookends: {
      bg: oc.gray[1],
      fg: 'black',
      border: oc.gray[5],
    },

    // Menu element
    menu: {
      bg: oc.gray[1],
      fg: 'black',
      border: oc.gray[5],
    },

    // Blocks, sections
    primary: {
      bg: 'white',
      fg: 'black',
      border: oc.gray[5],
    },

    // Contrast to the primary
    secondary: {
      bg: oc.gray[3],
      fg: 'black',
      border: oc.gray[6],
    },

    table: {
      bg: 'white',
      fg: 'black',
      border: oc.gray[5],
    },

    tableFocused: {
      bg: oc.gray[2],
      fg: 'black',
      border: oc.gray[6],
    },

    tableSecondary: {
      bg: oc.pink[1],
      fg: 'black',
      border: oc.pink[3],
    },

    tableSecondaryFocused: {
      bg: oc.pink[2],
      fg: 'black',
      border: oc.pink[6],
    },

    actionable: {
      bg: oc.pink[2],
      fg: 'black',
      border: oc.pink[5],
    },
  },

  elements: {
    link: oc.blue[7],
    linkFocused: oc.blue[9],
  },
}


module.exports = {
  colors,

  variants: {
    menu: {
      py: 2,
      px: 3,
      my: 3,
      bg: 'colorsets.menu.bg',
      color: 'colorsets.menu.fg',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: 'colorsets.menu.border',
      '& a[data-active="true"]::before': {
        content: '"▸"',
        position: 'absolute',
        marginTop: '-1px',
        marginLeft: '-11px',
        color: 'orangered',
      },
      '& a': {
        color: 'elements.link',
      },
      '& a[data-active="true"]': {
        color: 'elements.linkFocused',
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
    default: {
      bg: 'blue.1',
      color: 'gray.8',
      borderColor: 'blue.6',
    },

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
