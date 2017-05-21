"use strict";

/* eslint camelcase:0 */

const R = require('ramda')
    , pointer = require('json-pointer')
    , { describePatch, hashPatch } = require('../utils/patch')


// Return a tuple representing the type of change, which will be in the form:
// [type, operation, ...identifiers]. If this patch does not effect any periods
// or period collections, return null.
function getChangeType(patch) {
  const { type, collectionID, periodID, attribute } = describePatch(patch)

  return [type._name].concat(
    periodID
      ? attribute ? [collectionID, periodID] : [collectionID]
      : attribute ? [collectionID] : []
  ).map(pointer.unescape)
}


function groupByChangeType(patches) {
  return patches.reduce((acc, patch) => {
    const changePath = getChangeType(patch);

    return !changePath ? acc : R.over(
      R.lensPath(changePath),
      ps => (ps || []).concat(patch),
      acc
    )
  }, {});
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


async function filterByHash(patches, keepMatched, hashMatchFn) {
  const additions = []
      , patchesByHash = new Map()

  patches.forEach(patch => {
    const parsed = describePatch(patch)

    const affectsWholeEntity = (
      (parsed.collectionID || parsed.periodID) &&
      !parsed.attribute
    )

    if (affectsWholeEntity) {
      // These are patches that add a new period or period collection. They will
      // automatically be added without checking hashes.
      if (patch.op === 'add') {
        additions.push(patch)
      } else if (patch.op !== 'remove') {
        // FIXME: better error, dummy
        throw new Error('Invalid patch');
      }

      // Otherwise, these are patches that "remove" a new period or period
      // collection. This is the result of a patch not being in the target
      // dataset. We just remove them from consideration

    } else {
      patchesByHash.set(hashPatch(patch), patch);
    }
  })

  const matchingHashes = await patchesByHash.size
    ? hashMatchFn([...patchesByHash.keys()].sort())
    : []

  return [...patchesByHash]
    .filter(([hash]) =>
      keepMatched
        ? matchingHashes.indexOf(hash) !== -1
        : matchingHashes.indexOf(hash) === -1)
    .map(([, patch]) => patch)
    .concat(additions)
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
