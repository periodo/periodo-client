"use strict";

var Immutable = require('immutable')
  , { parsePatchPath } = require('../utils/patch')

// Return a tuple representing the type of change, which will be in the form:
// [type, operation, (...identifiers)]. If this patch does not effect any
// periods or period collections, return null.
function getChangeType(patch) {
  var parsed = parsePatchPath(patch.get('path'))

  if (!parsed) return null;

  if (parsed.type === 'period') {
    if (!parsed.label) {
      // This is an add/remove operation
      return Immutable.List(['period', patch.get('op'), parsed.collection_id]);
    }
    return Immutable.List(['period', 'edit', parsed.collection_id, parsed.id]);
  }

  if (parsed.type === 'periodCollection') {
    if (!parsed.label) {
      return Immutable.List(['periodization', patch.get('op')]);
    }
    return Immutable.List(['periodidzation', 'edit', parsed.id]);
  }

  return null;
}

function groupByChangeType(patches) {
  return Immutable.Map().withMutations(map => {
    patches.forEach(patch => {
      var path = getChangeType(patch);
      if (!path) return true;
      map.updateIn(path, Immutable.List(), list => list.push(patch));
    });
  });
}

module.exports = { groupByChangeType }
