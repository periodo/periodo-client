"use strict";

/* eslint camelcase:0 */

var Immutable = require('immutable')
  , pointer = require('json-pointer')
  , { parsePatchPath, hashPatch } = require('../utils/patch')


// Return a tuple representing the type of change, which will be in the form:
// [type, operation, ...identifiers]. If this patch does not effect any periods
// or period collections, return null.
function getChangeType(patch) {
  var parsed = parsePatchPath(patch.get('path'))

  if (!parsed) return null;

  // Parsed.label indicates that a single field was changed, not a whole period
  // (i.e. adding or removing)

  if (parsed.type === 'period') {
    let type = `${parsed.label ? 'edit' : patch.get('op')}Period`
      , collection_id = pointer.unescape(parsed.collection_id)
      , period_id = pointer.unescape(parsed.id)

    return parsed.label ?
      [type, collection_id, period_id] :
      [type, collection_id]

  } else if (parsed.type === 'periodCollection') {
    let type = `${parsed.label ? 'edit' : patch.get('op')}PeriodCollection`
      , collection_id = pointer.unescape(parsed.id)

    return parsed.label ?
      [type, collection_id] :
      [type]
  }

  return null;
}


function groupByChangeType(patches) {
  return Immutable.Map().withMutations(map => {
    patches.forEach(patch => {
      var path = getChangeType(patch);

      if (!path) return true;
      if (!map.hasIn(path)) {
        map.setIn(path, Immutable.List())
      }

      map.updateIn(path, list => list.push(patch));
    });
  });
}


function filterByHash(patches, keepMatched, hashMatchFn) {
  var patchSet = patches.toOrderedSet()
    , additions
    , hashesToCheck
    , matched

  // These are patches that add a new period or period collection. They will
  // automatically be added without checking hashes.
  additions = patchSet.filter(patch => {
    if (patch instanceof Immutable.Map && patch.get('op') === 'add') {
      let parsed

      try {
        parsed = parsePatchPath(patch.get('path'));
      } catch (err) {
        parsed = {};
      }

      return (
        (parsed.type === 'periodCollection' || parsed.type === 'period') &&
        !parsed.label
      )
    }

    return false;
  });

  hashesToCheck = patchSet
    .subtract(additions)
    .toMap()
    .mapKeys((k, v) => hashPatch(v.toJS()))

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
        .toList()
        .map(patch => patch instanceof Immutable.List ? patch : Immutable.List.of(patch))
        .flatten(true)
    })
    .then(filteredPatches => filteredPatches.concat(additions));
}

function getOrcids(patches) {
  return patches
    .map(patch => Immutable.List.of(patch.get('created_by'))
      .concat(patch.get('comments', Immutable.List())
        .map(comment => comment.get('author'))))
    .flatten(1)
    .toSet()
}


module.exports = {
  groupByChangeType,
  filterByHash,
  getOrcids
}
