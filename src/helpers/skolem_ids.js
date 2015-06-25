"use strict";

var Immutable = require('immutable')

function isSkolemID(id) {
  return (
    typeof id === 'string' &&
    id.indexOf('.well-known/genid/') !== -1
  )
}

function skolemIDNotPresent(id) {
  throw new Error(`Skolem ID ${id} not present in replacement map.`);
}

function replaceSkolemIDs(data, map) {
  function mapper(key, val) {
    var newKey
      , newVal

    if (isSkolemID(val)) {
      newVal = map.get(val);
      if (!newVal) skolemIDNotPresent(val);
    } else if (val instanceof Immutable.Iterable) {
      newVal = replaceSkolemIDs(val, map);
    }

    if (isSkolemID(key)) {
      newKey = map.get(key);
      if (!newKey) skolemIDNotPresent(key);
    }

    return [newKey || key, newVal || val]
  }

  return Immutable.Iterable.isKeyed(data) ?
    data.mapEntries(([key, val]) => mapper(key, val)) :
    data.map(val => mapper(null, val)[1])
}

module.exports = { isSkolemID, replaceSkolemIDs }
