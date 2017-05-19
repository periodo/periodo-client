"use strict";

// Truncate a number to n left-most digits, rounding up for positive numbers
// and down for negative numbers.
//
// Turns something like 34112312 into 34000000
module.exports = function (leftDigits, number) {
  var places = (Math.floor(Math.abs(number)) + '').length
    , power = Math.pow(10, places - (leftDigits || 2))
    , divided = number / power
    , rounded = (number > 0 ? Math.ceil : Math.floor)(divided)

  return rounded * power;
}
