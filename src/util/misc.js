"use strict";

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

module.exports = {
  truncateNumber,
  oneOf,
}

