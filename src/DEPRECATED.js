"use strict";

module.exports = function _deprecated(reason) {
  return function deprecated() {
    throw new Error(`DEPRECATED: ${reason}`)
  }
}
