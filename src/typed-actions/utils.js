"use strict";

function isUnionTypeRecord(obj) {
  return (
    Array.isArray(obj._keys) &&
    typeof obj._name === 'string' &&
    typeof obj.case === 'function'
  )
}

module.exports = {
  isUnionTypeRecord,
}
