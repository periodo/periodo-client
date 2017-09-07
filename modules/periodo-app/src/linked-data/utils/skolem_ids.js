"use strict";

function isSkolemID(id) {
  return (
    typeof id === 'string' &&
    id.indexOf('.well-known/genid/') !== -1
  )
}

// For Immutable iterable `data`, replace all keys in `map` with their
// corresponding values.
function replaceIDs(data, map) {
  function mapper(key, val) {
    let newKey
      , newVal

    if (map.has(val)) {
      newVal = map.get(val);
    } else if (val instanceof Immutable.Iterable) {
      newVal = replaceIDs(val, map);
    } else {
      newVal = val;
    }

    if (map.has(key)) {
      newKey = map.get(key);
    } else {
      newKey = key;
    }

    return [newKey, newVal]
  }

  return Immutable.Iterable.isKeyed(data)
    ? data.mapEntries(([key, val]) => mapper(key, val))
    : data.map(val => mapper(null, val)[1])
}

module.exports = { isSkolemID, replaceIDs }
