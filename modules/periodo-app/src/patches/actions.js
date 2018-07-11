"use strict";

const jsonpatch = require('fast-json-patch')
    , BackendAction = require('../backends/actions')
    , { BackendStorage } = require('../backends/types')
    , { makeTypedAction, getResponse } = require('../typed-actions')
    , { makePatch } = require('./patch')
    , { filterByHash } = require('./patch_collection')
    , { PatchDirection } = require('./types')

const PatchAction = module.exports = makeTypedAction({
  GetLocalPatch: {
    exec: getLocalPatch,
    request: {
      patchURL: String,
    },
    response: {
      patch: Object,
      fromDataset: Object,
      toDataset: Object,
      patchText: Object,
    }
  },

  GetOpenServerPatches: {
    exec: getOpenServerPatches,
    request: {
    },
    response: {
      patches: Object,
    }
  },
  GenerateDatasetPatch: {
    exec: generateDatasetPatch,
    request: {
      origin: BackendStorage,
      remote: BackendStorage,
      direction: PatchDirection
    },
    response: {
      patch: Object,
      localDataset: Object,
      remoteDataset: Object,
    }
  },
  SubmitPatch: {
    exec: submitPatch,
    request: {
      backend: BackendStorage,
      patch: Object,
    },
    response: {
      patchURL: String,
    }
  }
})


// push means going from a->b; pull from b->a
function generateDatasetPatch(
  localBackend,
  remoteBackend,
  direction
) {
  return async (dispatch, getState, { db }) => {
    const [localReq, remoteReq] = await Promise.all([
      dispatch(BackendAction.GetBackendDataset(localBackend, true)),
      dispatch(BackendAction.GetBackendDataset(remoteBackend, true)),
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
  }
}

function submitPatch(storage, patch) {
  const action = PatchAction.SubmitPatch(storage, patch)

  return async (dispatch, getState, { db }) => {
    const resp = await fetch('d.jsonld', {
      body: JSON.stringify(patch),
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getState().auth.settings.oauthToken}`
      }
    })

    if (resp.status === 401) {
      throw new Error('Bad authentication credentials. Sign out and sign back in.')
    }
    if (!resp.ok) {
      const err = new Error('Error submitting patch')
      err.resp = resp;
      throw err;
    }

    const patchURL = resp.headers.get('Location')

    await db.patchSubmissions.put({
      patchURL,
      backendID: storage.id,
      resolved: false,
    })

    return { patchURL }
  }
}

async function getLocalPatch(patchURL) {
  const patchResp = await fetch(patchURL)

  if (!patchResp.ok) throw new Error('Could not fetch patch')

  const patch = await patchResp.json()

  const [ fromDatasetResp, patchTextResp ] = await Promise.all([
    fetch(patch.created_from),
    fetch(patch.text),
  ])

  if (!fromDatasetResp.ok) {
    throw new Error('Could not fetch source dataset')
  }

  if (!patchTextResp.ok) {
    throw new Error('Could not fetch patch text')
  }

  const fromDataset = await fromDatasetResp.json()
      , patchText = await patchTextResp.json()

  const toDataset = jsonpatch.applyPatch(
    jsonpatch.deepClone(fromDataset),
    jsonpatch.deepClone(patchText)
  ).newDocument

  return {
    patch,
    fromDataset,
    toDataset,
    patchText,
  }
}

async function getOpenServerPatches() {
  const resp = await fetch('/patches.json?open=true')

  return {
    patches: await resp.json()
  }
}

/*
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
