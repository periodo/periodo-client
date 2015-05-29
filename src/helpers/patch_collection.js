"use strict";

var Immutable = require('immutable')
  , { parsePatchPath, hashPatch } = require('../utils/patch')

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

function isChangePair(a, b) {
  return (
    a &&
    b &&
    a.get('op') === 'remove' &&
    b.get('op') === 'add' &&
    a.get('path') === b.get('path')
  )
}

function combineChangePairs(patches) {
  var isPair

  return patches
    .map((patch, idx) => {
      var next

      if (isPair) return (isPair = false);

      next = patches.get(idx + 1)
      isPair = isChangePair(patch, next)

      return isPair ? Immutable.List([patch, next]) : patch;
    })
    .filter(patch => patch)
}


function filterByHash(patches, keepMatched, hashMatchFn) {
  var patchSet = combineChangePairs(patches).toSet()
    , additions
    , hashesToCheck
    , matched

  additions = patchSet.filter(patch => (
    patch instanceof Immutable.Map &&
    patch.get('op') === 'add'
  ));

  hashesToCheck = patchSet
    .subtract(additions)
    .toMap()
    .mapKeys((k, v) => hashPatch(
      (v instanceof Immutable.List ? v.get(1) : v).toJS()
    ));

  matched = hashesToCheck.size === 0 ?
    [] :
    hashMatchFn(hashesToCheck.keySeq().sort());

  return Promise.resolve(matched)
    .then(matchingHashes => {
      return hashesToCheck
        .filter((val, hash) => (
          keepMatched ?
          matchingHashes.indexOf(hash) !== -1 :
          matchingHashes.indexOf(hash) === -1
        ))
        .valueSeq()
        .map(patch => patch instanceof Immutable.List ? patch : Immutable.List.of(patch))
        .flatten(true)
    })
    .then(filteredPatches => filteredPatches.concat(additions));
}


module.exports = { groupByChangeType, combineChangePairs, filterByHash }
