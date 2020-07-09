"use strict";

const jsonpatch = require('fast-json-patch')
    , pointer = require('json-pointer')
    , md5 = require('spark-md5')
    , stringify = require('json-stable-stringify')
    , { PatchType, LocalPatch } = require('./types')
    , { isSkolemID } = require('../linked-data/utils/skolem_ids')
    , DatasetProxy = require('../backends/dataset_proxy')


/* Generate a JSON Patch to transform
 *
 * There are an infinite number of JSON patches that could patch one object
 * into another. `jsonpatch.compare()` generates the deepest possible
 * differences. This algorithm generates patches at (potentially) shallower
 * levels in order to make patches that are more semantically useful for
 * tracking changes to periods and authorities.
 */
function makePatch(before, after) {
  return jsonpatch.compare(before, after)
    .reduce(({ patches=[], replaced=[]}, patch) => {
      const { path, op } = patch
          , { authorityID, periodID, attribute } = PatchType.fromPatch(patch)

      const isSimpleAttributeChange = (
        (op === 'add' || op === 'remove') &&
        path.endsWith(`/${attribute}`)
      )

      if (!attribute || isSimpleAttributeChange) {
        return {
          patches: patches.concat(patch),
          replaced,
        }
      }

      const attributePointer = pointer.compile(
        periodID
          ? [ 'authorities', authorityID, 'periods', periodID, attribute ]
          : [ 'authorities', authorityID, attribute ]
      )

      return replaced.includes(attributePointer)
        ? {
          patches,
          replaced,
        }
        : {
          patches: patches.concat({
            op: 'add',
            path: attributePointer,
            value: pointer.get(after, attributePointer),
          }),
          replaced: replaced.concat(attributePointer),
        }
    }, {
      patches: [],
      replaced: [],
    })
    .patches
}

function getAffected(patches) {
  return [].concat(patches).reduce(({ periods, authorities }, patch) => {
    const { authorityID, periodID } = PatchType.fromPatch(patch)

    return {
      periods: periods.concat(periodID || []),
      authorities: authorities.concat(authorityID || []),
    }
  }, {
    authorities: [],
    periods: [],
  })
}


function hashPatch(p) { return md5.hash(stringify(p)) }


function formatPatch(oldData, newData, message) {
  const forward = makePatch(oldData, newData)
    , backward = makePatch(newData, oldData)
    , affected = getAffected(forward)

  const description = forward
    .map(patch => PatchType.fromPatch(patch).getLabel())
    .join('\n');

  message = message
    ? (message + '\n' + description)
    : description

  return LocalPatch.LocalPatchOf({
    forward,
    backward,
    message,
    forwardHashes: forward.map(hashPatch),
    backwardHashes: backward.map(hashPatch),
    created: new Date().getTime(),
    affectedAuthorities: affected.authorities,
    affectedPeriods: affected.periods,
  })
}

function makeFilteredPatch(localDataset, remoteDataset, localPatches, direction) {
  const finalPatch = []

  const rawPatch = direction.case({
    Push: () => makePatch(remoteDataset, localDataset),
    Pull: () => makePatch(localDataset, remoteDataset),
  })

  const yes = () => true
      , no = () => false

  const localHashes = {}

  ;[ 'forward', 'backward' ].forEach(dir => {
    localHashes[dir] = new Set(localPatches.map(p => p[`${dir}Hashes`]).flat())
  })

  const inLocalForwardPatches = patch => () =>
    localHashes.forward.has(hashPatch(patch))

  const notInLocalBackwardPatches = patch => () =>
    !localHashes.backward.has(hashPatch(patch))

  rawPatch.forEach(patch => {
    const patchType = PatchType.fromPatch(patch)

    const includeInPatch = patchType.case({
      // Always include added items in a patch
      AddAuthority: yes,

      ChangeAuthority: () => direction.case({
        // When pushing changes, always include changed attributes in a patch
        Push: yes,

        // When pulling changes, do not include changes that would revert a
        // change that has been done locally
        Pull: notInLocalBackwardPatches(patch),
      }),
      RemoveAuthority: authorityID => direction.case({
        // When pushing deletions, only include those deletions which were
        // explicitly carried out. Don't include deletions which are merely
        // present because the authority was not present in the local data
        // source (i.e. it wasn't pulled down already)
        Push: inLocalForwardPatches(patch),

        // When pulling deletions, only include ones where something with a
        // persistent URI is deleted. Don't delete periods with skolem IRIs
        // (i.e. periods that were added in the local data source but only
        // exist there for the moment)
        Pull: () => !isSkolemID(authorityID),
      }),

      // Same applies to periods as above
      AddPeriod: yes,
      ChangePeriod: () => direction.case({
        Push: yes,
        Pull: notInLocalBackwardPatches(patch),
      }),
      RemovePeriod: (authorityID, periodID) => direction.case({
        Push: inLocalForwardPatches(patch),
        Pull: () => !isSkolemID(periodID),
      }),

      // These should not be done from the client
      ChangeLinkedData: no,
      Unknown: no,
    })

    if (includeInPatch) {
      finalPatch.push(patch)
    }
  })

  return finalPatch
}

function validatePatch(dataset, patch) {
  const newRawDataset = jsonpatch.applyPatch(
    jsonpatch.deepClone(dataset),
    jsonpatch.deepClone(patch)
  ).newDocument

  const newDataset = new DatasetProxy(newRawDataset)

  return makePatch(dataset, newDataset.validated)
}


module.exports = {
  makePatch,
  makeFilteredPatch,
  validatePatch,
  formatPatch,
  hashPatch,
  getAffected,
}
