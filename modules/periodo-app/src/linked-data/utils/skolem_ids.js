"use strict";

const R = require('ramda')

function isSkolemID(id) {
  return (
    typeof id === 'string' &&
    id.indexOf('.well-known/genid/') !== -1
  )
}

// For object or array `data`, replace all keys/vals in `map` with their
// corresponding values.
function replaceIDs(data, map) {
  const mapper = ([key, val]) => [
    map[key] || key,
    typeof val === 'string'
      ? map[val] || val
      : replaceIDs(val, map),
  ]

  return Array.isArray(data)
    ? data.map(val => mapper([null, val])[1])
    : R.fromPairs(R.map(mapper, Object.entries(data)))
}

module.exports = { isSkolemID, replaceIDs }
