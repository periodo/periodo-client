"use strict";

const { fetchBackend } = require('../backends/actions')
    , { makePatch } = require('./utils/patch')
    , { filterByHash } = require('./utils/patch_collection')
    , { PatchDirection, PatchAction } = require('./types')


// push means going from a->b; pull from b->a
function generateDatasetPatch(
  originBackend,
  remoteBackend,
  direction=PatchDirection.Push()
) {
  const action = PatchAction.GenerateDatasetPatch(
    originBackend,
    remoteBackend,
    direction
  )

  return action.do(async (dispatch, getState, { db }) => {
    const [originReq, remoteReq] = await Promise.all([
      dispatch(fetchBackend(originBackend)),
      dispatch(fetchBackend(remoteBackend)),
    ])

    // FIXME: Handle errors in responses?

    const originID = originReq.readyState.response.backend.id
        , originDataset = originReq.readyState.response.dataset
        , remoteDataset = remoteReq.readyState.response.dataset

    const hashObjectStore = direction.case({
      Push: () => 'forwardHashes',
      Pull: () => 'backwardHashes',
    })

    const filterHashes = hashes =>
      db.localBackendPatches
        .where(hashObjectStore)
        .anyOf(hashes.toArray())
        .and(({ backendID }) => backendID === originID)
        .uniqueKeys()

    // if PUSH, make remote look like origin.
    // if PULL, make origin look like remote.
    const rawPatch = direction.case({
      Push: () => makePatch(remoteDataset, originDataset),
      Pull: () => makePatch(originDataset, remoteDataset)
    })

    return filterByHash(rawPatch, direction, filterHashes)
  })
}

module.exports = {
  generateDatasetPatch
}

/*
function IDBBackend(opts) {
  this.saveSubmittedPatch = function (patchObj) {
    return require('./db')(this.name).localPatches
      .put(patchObj)
      .then(() => patchObj.id)
  }

  this.markSubmittedPatchMerged = function (localPatchID, serverPatchObj) {
    const db = require('./db')(this.name)
      , prefixMatch = require('./utils/prefix_match')
      , serverURL = prefixMatch(serverPatchObj.created_from, serverPatchObj.url)

    const identifiers = Object.keys(serverPatchObj.identifier_map).map(localID => ({
      id: `${serverURL}|${localID}`,
      serverURL,
      localID,
      serverID: serverPatchObj.identifier_map[localID]
    }));

    // FIXME: We don't use ID maps anymore. instead, we should go ahead and
    // replace any mentions of the skolem ID with the new permanent identifier
    return db.transaction('rw', db.idMap, db.localPatches, () => {
      db.localPatches.update(localPatchID, { resolved: true, merged: true });
      identifiers.forEach(obj => db.idMap.put(obj));
    });
  }

  this.markSubmittedPatchNotMerged = function (localPatchID) {
    return require('./db')(this.name).localPatches.update(localPatchID, {
      resolved: true,
      merged: false
    });
  }

  this.getSubmittedPatch = function (id) {
    return require('./db')(this.name).localPatches.get(id);
  }


  this.getSubmittedPatches = function () {
    return require('./db')(this.name).localPatches.toArray()
  }
}
*/
