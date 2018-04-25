"use strict";

/* eslint camelcase:0 */

const R = require('ramda')
    , { PatchType } = require('./types')
    , { hashPatch } = require('./patch')
    , { replaceIDs } = require('../linked-data/utils/skolem_ids')

function groupByChangeType(patches) {
  let ret = {}

  patches.forEach(patch => {
    const type = PatchType.fromPatch(patch)

    const authorityID = a => [type._name, a]
        , periodID = (a, b) => [type._name, a, b]
        , topLevel = () => [type._name]

    const path = type.case({
      AddPeriod: authorityID,
      RemovePeriod: authorityID,
      ChangePeriod: periodID,
      ChangeAuthority: authorityID,
      _: topLevel
    })

    ret = R.over(
      R.lensPath(path),
      (arr=[]) => [...arr, patch],
      ret
    )
  })

  return ret
}

// FIXME: this doesn't work!
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
    const parsed = PatchType.fromPatch(patch)

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
  return R.pipe(
    R.chain(patch => [].concat(
      patch.created_by,
      patch.comments.map(comment => comment.author)
    )),
    R.uniq
  )(patches)
}


module.exports = {
  replaceMappedIDs,
  groupByChangeType,
  filterByHash,
  getOrcids
}