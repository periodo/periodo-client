"use strict";

/* eslint camelcase:0 */

const Immutable = require('immutable')
    , pointer = require('json-pointer')
    , { describePatch, hashPatch } = require('../utils/patch')


// Return a tuple representing the type of change, which will be in the form:
// [type, operation, ...identifiers]. If this patch does not effect any periods
// or period collections, return null.
function getChangeType(patch) {
  const { type, collectionID, periodID, attribute } = describePatch(patch.toJS())

  return [type._name].concat(
    periodID
      ? attribute ? [collectionID, periodID] : [collectionID]
      : attribute ? [collectionID] : []
  ).map(pointer.unescape)
}


function groupByChangeType(patches) {
  return Immutable.Map().withMutations(map => {
    patches.forEach(patch => {
      const path = getChangeType(patch);

      if (!path) return true;

      map.updateIn(path, Immutable.List(), list => list.push(patch));
    });
  });
}


function replaceMappedIDs(fromBackendName, toBackendName, dataset) {
  return require('../db').backendIDMaps
    .where('[fromBackendName+toBackendName]')
      .equals([fromBackendName.name, toBackendName.name])
    .toArray()
    .then(idMapObjects => {
      const idMap = Immutable.List(idMapObjects)
        .toMap()
        .mapEntries(([, { fromID, toID }]) => [fromID, toID])

      return replaceIDs(dataset, idMap)
    })
}


function filterByHash(patches, keepMatched, hashMatchFn) {
  const patchSet = Immutable.fromJS(patches).toOrderedSet()

  // These are patches that add a new period or period collection. They will
  // automatically be added without checking hashes.
  const additions = patchSet.filter(patch => {
    if (patch instanceof Immutable.Map && patch.get('op') === 'add') {
      let parsed

      try {
        parsed = describePatch(patch.toJS());
      } catch (err) {
        parsed = {};
      }

      return (
        (parsed.collectionID || parsed.periodID) && !parsed.attribute
      )
    }

    return false;
  });

  const hashesToCheck = patchSet
    .subtract(additions)
    .toMap()
    .mapKeys((k, v) => hashPatch(v.toJS()))

  const matched = hashesToCheck.size === 0 ?
    [] :
    hashMatchFn(hashesToCheck.keySeq().sort());

  return Promise.resolve(matched)
    .then(matchingHashes => {
      return hashesToCheck
        .filter((val, hash) =>
          keepMatched
            ? matchingHashes.indexOf(hash) !== -1
            : matchingHashes.indexOf(hash) === -1
        )
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
