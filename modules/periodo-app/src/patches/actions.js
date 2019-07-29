"use strict";

const url = require('url')
    , jsonpatch = require('fast-json-patch')
    , BackendAction = require('../backends/actions')
    , LinkedDataAction = require('../linked-data/actions')
    , parseLinkHeader = require('parse-link-header')
    , { Backend, BackendStorage } = require('../backends/types')
    , { makeTypedAction, getResponse } = require('org-async-actions')
    , { makePatch } = require('./patch')
    , { filterByHash } = require('./patch_collection')
    , { PatchDirection, PatchFate } = require('./types')
    , isURL = require('is-url')
    , DatasetProxy = require('../backends/dataset_proxy')
    , globals = require('../globals')

const PatchAction = module.exports = makeTypedAction({
  GetLocalPatch: {
    exec: getLocalPatch,
    request: {
      remoteBackend: Backend,
      patchURL: String,
    },
    response: {
      patch: Object,
      fromDataset: Object,
      toDataset: Object,
      patchText: Object,
      mergeURL: val => val === null || isURL(val),
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
      backend: Backend,
      remoteBackend: Backend,
      patch: Object,
    },
    response: {
      patchURL: String,
    }
  },
  AddPatchComment: {
    exec: addPatchComment,
    request: {
      remoteBackend: Backend,
      patchURL: isURL,
      comment: String,
    },
    response: {
    }
  },
  DecidePatchFate: {
    exec: decidePatchFate,
    request: {
      remoteBackend: Backend,
      patchURL: isURL,
      fate: PatchFate,
    },
    response: {
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
    const [ localReq, remoteReq ] = await Promise.all([
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
      Push: () => makePatch(remoteDataset.raw, localDataset.raw),
      Pull: () => makePatch(localDataset.raw, remoteDataset.raw)
    })

    const patch = await filterByHash(rawPatch, direction, filterHashes)

    return {
      patch,
      localDataset,
      remoteDataset,
    }
  }
}

function withAuthHeaders(backend, extra) {
  const { token } = (backend.metadata.orcidCredential || {})

  return Object.assign({}, extra, !token ? {} : {
    Authorization: `Bearer ${token}`,
  })
}

function submitPatch(localBackend, remoteBackend, patch) {
  return async (dispatch, getState, { db }) => {
    const resp = await fetch(new URL('d.jsonld', globals.periodoServerURL).href, {
      body: JSON.stringify(patch),
      method: 'PATCH',
      headers: withAuthHeaders(remoteBackend, {
        'Content-Type': 'application/json',
      })
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
      backendID: localBackend.storage.id,
      resolved: false,
    })

    return { patchURL }
  }
}

function getLocalPatch(remoteBackend, patchURL) {
  return async (dispatch, getState) => {
    const ret = {}

    if (!patchURL.startsWith('http')) {
      patchURL = new URL(patchURL, remoteBackend.storage.url)
    }

    const patchResp = await fetch(patchURL, {
      headers: withAuthHeaders(remoteBackend)
    })

    const link = parseLinkHeader(patchResp.headers.get('Link'))

    if (link && link.merge) {
      ret.mergeURL = url.resolve(patchResp.url, link.merge.url)
    } else {
      ret.mergeURL = null
    }

    if (!patchResp.ok) throw new Error('Could not fetch patch')

    const patch = await patchResp.json()

    const existing = getState().patches.patches[patchURL]

    // If we've already generated the source and destination datasets, only
    // refresh the patch resource itself. (Which may change in the case of,
    // e.g. commenting, or merging a patch.
    if (existing) {
      Object.assign(ret, existing, { patch })
    } else {
      const [ fromRawDatasetResp, patchTextResp ] = await Promise.all([
        fetch(patch.created_from),
        fetch(patch.text),
      ])

      if (!fromRawDatasetResp.ok) {
        throw new Error('Could not fetch source dataset')
      }

      if (!patchTextResp.ok) {
        throw new Error('Could not fetch patch text')
      }

      const fromRawDataset = await fromRawDatasetResp.json()
          , patchText = await patchTextResp.json()

      const toRawDataset = jsonpatch.applyPatch(
        jsonpatch.deepClone(fromRawDataset),
        jsonpatch.deepClone(patchText)
      ).newDocument

      Object.assign(ret, {
        patch,
        fromDataset: new DatasetProxy(fromRawDataset),
        toDataset: new DatasetProxy(toRawDataset),
        patchText,
      })
    }

    // Fetch ORCIDs
    await dispatch(LinkedDataAction.FetchORCIDs(
      [...new Set(patch.comments.map(patch => patch.author))]
    ))

    ret.patch.comments.forEach(comment => {
      comment.author = {
        url: comment.author,
        label: getState().linkedData.nameByORCID[comment.author],
      }
    })

    return ret;
  }
}

async function getOpenServerPatches() {
  const patchURL = new URL('patches.json?open=true', globals.periodoServerURL).href
      , resp = await fetch(patchURL)

  return {
    patches: await resp.json()
  }
}

function addPatchComment(backend, patchURL, comment) {
  let commentURL = patchURL

  if (!commentURL.endsWith('/')) commentURL += '/';
  commentURL += 'messages';

  return async dispatch => {
    const resp = await fetch(commentURL, {
      body: JSON.stringify({ message: comment }),
      method: 'POST',
      headers: withAuthHeaders(backend, {
        'Content-Type': 'application/json',
      })
    })

    switch (resp.status) {
    case 401:
      throw new Error('Bad authentication credentials. Sign out and sign back in.')

    case 403:
      throw new Error('You do not have permission to merge patches')

    default:
      if (!resp.ok) {
        const err = new Error('Error posting comment')
        err.resp = resp;
        throw err;
      }
    }

    // Refresh patch
    await dispatch(PatchAction.GetLocalPatch(backend, patchURL))

    return {}
  }
}

function decidePatchFate(backend, mergeURL, fate) {
  return async (dispatch, { db }) => {
    const actionURL = fate.case({
      Accept: () => mergeURL,
      Reject: () => mergeURL.replace('merge', 'reject'), // lol.
    })

    const resp = await fetch(actionURL, {
      method: 'POST',
      headers: withAuthHeaders(backend, {
        'Content-Type': 'application/json' // necessary? probably not.
      })
    })

    // TODO: Update local skolem ids for new items (see code below)

    return {}
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
