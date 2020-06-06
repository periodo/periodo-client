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


module.exports = {
  colors: oc,
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
}
