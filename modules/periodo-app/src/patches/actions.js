"use strict";

const { fetchBackend } = require('../backends/actions')
    , { getResponse } = require('../typed-actions/utils')
    , { makePatch } = require('./patch')
    , { filterByHash } = require('./patch_collection')
    , { PatchDirection, PatchAction } = require('./types')

function prefixMatch(a, b) {
  let prefix = ''

  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) {
      prefix += a[i];
    } else {
      break;
    }
  }

  return prefix;
}



// push means going from a->b; pull from b->a
function generateDatasetPatch(
  localBackend,
  remoteBackend,
  direction
) {
  const action = PatchAction.GenerateDatasetPatch(
    localBackend,
    remoteBackend,
    direction
  )

  return action.do(async (dispatch, getState, { db }) => {
    const [localReq, remoteReq] = await Promise.all([
      dispatch(fetchBackend(localBackend)),
      dispatch(fetchBackend(remoteBackend)),
    ])

    // FIXME: Handle errors in responses?
    const localID = getResponse(localReq).backend.storage.id
        , localDataset = getResponse(localReq).dataset
        , remoteDataset = getResponse(remoteReq).dataset

    const hashObjectStore = direction.case({
      Push: () => 'forwardHashes',
      Pull: () => 'backwardHashes',
    })

    const filterHashes = hashes =>
      db.localBackendPatches
        .where(hashObjectStore)
        .anyOf(hashes)
        .and(({ backendID }) => backendID === localID)
        .uniqueKeys()

    const rawPatch = direction.case({
      Push: () => makePatch(remoteDataset, localDataset),
      Pull: () => makePatch(localDataset, remoteDataset)
    })

    const patch = await filterByHash(rawPatch, direction, filterHashes)

    return {
      patch,
      localDataset,
      remoteDataset,
    }
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
