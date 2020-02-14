"use strict";

const R = require('ramda')
    , { PatchType } = require('./types')
    , { hashPatch } = require('./patch')

function groupByChangeType(patches) {
  let ret = {}

  patches.forEach(patch => {
    const type = PatchType.fromPatch(patch)

    const authorityID = a => [ type._name, a ]
        , periodID = (a, b) => [ type._name, a, b ]
        , topLevel = () => [ type._name ]

    const path = type.case({
      AddPeriod: authorityID,
      RemovePeriod: authorityID,
      ChangePeriod: periodID,
      ChangeAuthority: authorityID,
      _: topLevel,
    })

    ret = R.over(
      R.lensPath(path),
      (arr=[]) => [ ...arr, patch ],
      ret
    )
  })

  return ret
}

async function filterByHash(patches, keepMatched, hashMatchFn) {
  const additions = []
      , patchesByHash = new Map()

  patches.forEach(patch => {
    const parsed = PatchType.fromPatch(patch)

    const affectsWholeEntity = (
      (parsed.authorityID || parsed.periodID) &&
      !parsed.attribute
    )

    if (affectsWholeEntity) {
      // These are patches that add a new period or authority. They will
      // automatically be added without checking hashes.
      if (patch.op === 'add') {
        additions.push(patch)
      } else if (patch.op !== 'remove') {
        // FIXME: better error, dummy
        throw new Error('Invalid patch');
      }

      // Otherwise, these are patches that "remove" a new period or authority
      // This is the result of a patch not being in the target dataset. We just
      // remove them from consideration

    } else {
      patchesByHash.set(hashPatch(patch), patch);
    }
  })

  const matchingHashes = await (patchesByHash.size
    ? hashMatchFn([ ...patchesByHash.keys() ].sort())
    : []
  )

  return [ ...patchesByHash ]
    .filter(([ hash ]) =>
      keepMatched
        ? matchingHashes.indexOf(hash) !== -1
        : matchingHashes.indexOf(hash) === -1)
    .map(([ , patch ]) => patch)
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
  groupByChangeType,
  filterByHash,
  getOrcids,
}
