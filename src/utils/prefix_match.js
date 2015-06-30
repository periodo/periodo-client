"use strict"

module.exports = function (a, b) {
  var prefix = ''

  for (var i = 0; i < a.length; i++) {
    if (a[i] === b[i]) {
      prefix += a[i];
    } else {
      break;
    }
  }

  return prefix;
}

