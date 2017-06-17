"use strict";

const url = require('url')

// Truncate a number to n left-most digits, rounding up for positive numbers
// and down for negative numbers.
//
// Turns something like 34112312 into 34000000
function truncateNumber(leftDigits, number) {
  const places = (Math.floor(Math.abs(number)) + '').length
      , power = Math.pow(10, places - (leftDigits || 2))
      , divided = number / power
      , rounded = (number > 0 ? Math.ceil : Math.floor)(divided)

  return rounded * power;
}

function oneOf(...candidates) {
  return x => {
    for (let i = 0; i < candidates.length; i++) {
      const val = candidates[i](x)
      if (val !== undefined) return val
    }
  }
}

function isURL(str) {
  if (!(typeof str === 'string')) {
    throw new Error('URL must be a string')
  }

  const { protocol, host } = url.parse(str)

  if (!(protocol && host)) {
    throw new Error(`Invalid URL: ${str}`);
  }

  return true;
}


module.exports = {
  truncateNumber,
  oneOf,
  isURL,
}
