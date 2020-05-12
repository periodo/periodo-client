"use strict";

const R = require('ramda')
    , url = require('url')
    , N3 = require('n3')
    , jsonpatch = require('fast-json-patch')
    , BackendAction = require('../backends/actions')
    , LinkedDataAction = require('../linked-data/actions')
    , parseLinkHeader = require('parse-link-header')
    , Type = require('union-type')
    , ns = require('../linked-data/ns')
    , { permalinkAwareFetch } = require('periodo-utils')
    , { normalizeDataset } = require('periodo-utils').dataset
    , { Backend, BackendStorage } = require('../backends/types')
    , { makeTypedAction, getResponse } = require('org-async-actions')
    , { makePatch } = require('./patch')
    , { filterByHash } = require('./patch_collection')
    , { PatchDirection, PatchFate } = require('./types')
    , { rdfListToArray, parseToPromise } = require('org-n3-utils')
    , { getPatchRepr } = require('../linked-data/utils/patch')
    , isURL = require('is-url')
    , DatasetProxy = require('../backends/dataset_proxy')

function isDatasetProxy(obj) {
  return obj instanceof DatasetProxy
}

function emptyRawDataset() {
  return {
    authorities: {},
    type: 'rdf:Bag',
  }
}


const PatchAction = module.exports = makeTypedAction({
  GetPatchRequest: {
    exec: getPatchRequest,
    request: {
      remoteBackend: Backend,
      patchURL: String,
    },
    response: {
      patch: Object,
      fromDataset: isDatasetProxy,
      toDataset: isDatasetProxy,
      patchText: Object,
      mergeURL: val => val === null || isURL(val),
    },
  },

  GetPatchRequestList: {
    exec: getPatchRequestList,
    request: {
      storage: BackendStorage,
    },
    response: {
      patchRequests: Object,
    },
  },

  GetBackendHistory: {
    exec: getBackendHistory,
    request: {
      storage: BackendStorage,
    },
    response: {
      // TODO: make this "patch" type
      patches: Type.ListOf(Object),
    },
  },

  GetPatch: {
    exec: getPatch,
    request: {
      storage: BackendStorage,
      patchID: String,
    },
    response: {
      dataset: isDatasetProxy,
      prevDataset: isDatasetProxy,
      patch: Object,
      change: Object,
      position: Object,
    },
  },

  GeneratePatch: {
    exec: generatePatch,
    request: {
      origin: BackendStorage,
      remote: BackendStorage,
      direction: PatchDirection,
    },
    response: {
      patch: Object,
      localDataset: Object,
      remoteDataset: Object,
    },
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
    },
  },
  AddPatchComment: {
    exec: addPatchComment,
    request: {
      remoteBackend: Backend,
      patchURL: isURL,
      comment: String,
    },
    response: {
    },
  },
  DecidePatchFate: {
    exec: decidePatchFate,
    request: {
      remoteBackend: Backend,
      patchURL: isURL,
      fate: PatchFate,
    },
    response: {
    },
  },
})


// push means going from a->b; pull from b->a
function generatePatch(
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
      Pull: () => makePatch(localDataset.raw, remoteDataset.raw),
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

  return {
    ...extra,
    ...(!token ? {} : {
      Authorization: `Bearer ${token}`,
    }),
  }
}

function submitPatch(localBackend, remoteBackend, patch) {
  return async (dispatch, getState, { db }) => {
    const remoteDatasetURL = new URL('d.jsonld', remoteBackend.storage.url).href

    const resp = await permalinkAwareFetch(remoteDatasetURL, {
      body: JSON.stringify(patch),
      method: 'PATCH',
      headers: withAuthHeaders(remoteBackend, {
        'Content-Type': 'application/json',
      }),
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

function getPatchRequest(remoteBackend, patchURL) {
  return async (dispatch, getState) => {
    const ret = {}

    if (!patchURL.startsWith('http')) {
      patchURL = new URL(patchURL, remoteBackend.storage.url)
    }

    const patchResp = await permalinkAwareFetch(patchURL, {
      headers: withAuthHeaders(remoteBackend),
    })

    const link = parseLinkHeader(patchResp.headers.get('Link'))

    if (link && link.merge) {
      ret.mergeURL = url.resolve(patchResp.url, link.merge.url)
    } else {
      ret.mergeURL = null
    }

    if (!patchResp.ok) throw new Error('Could not fetch patch')

    const patch = await patchResp.json()

    const existing = R.path([
      'patches',
      'byBackend',
      remoteBackend.asIdentifier(),
      'patchRequests',
      patchURL,
    ])(getState())

    // If we've already generated the source and destination datasets, only
    // refresh the patch resource itself. (Which may change in the case of,
    // e.g. commenting, or merging a patch.
    if (existing) {
      Object.assign(ret, existing, { patch })
    } else {
      const [ fromRawDatasetResp, patchTextResp ] = await Promise.all([
        permalinkAwareFetch(patch.created_from + '&inline-context'),
        permalinkAwareFetch(patch.text),
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
      [ ...new Set(patch.comments.map(patch => patch.author)) ]
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

async function getPatchRequestList(storage) {
  let patchRequests = []

  let patchURL = new URL('patches.json?limit=250', storage.url).href

  while (patchURL) {
    const resp = await permalinkAwareFetch(patchURL)
        , link = parseLinkHeader(resp.headers.get('Link'))

    patchRequests = [ ...patchRequests, ...(await resp.json()) ]

    if (link && link.next) {
      patchURL = link.next.url
    } else {
      break;
    }
  }

  return { patchRequests }
}

function getBackendHistory(storage) {
  return async (dispatch, getState, { db }) => {
    const existing = R.path([
      'patches',
      'byBackend',
      storage.asIdentifier(),
      'history',
    ])(getState())

    if (existing) return { patches: existing }

    const { dataset } = getResponse(
      await dispatch(BackendAction.GetBackendDataset(storage, false)))

    const patchesPromise =  storage.case({
      IndexedDB: async id => {
        const patches = await db.localBackendPatches
          .where('backendID')
          .equals(id)
          .toArray()

        return patches.map(p => ({
          id: p.id,
          submittedBy: '(local)',
          mergedBy: '(local)',
          time: p.created,
          mergeTime: p.created,
          affectedItems: {
            periods: p.affectedPeriods,
            authorities: p.affectedAuthorities,
          },
          patch: p.forward,
        }))
      },

      Web: async backendURL => {
        const url = new URL('history.nt?full', backendURL)
            , resp = await permalinkAwareFetch(url)

        if (!resp.ok) {
          throw new Error(`Could not get changelog for data source ${backendURL}`)
        }

        const parser = new N3.Parser()
            , store = new N3.Store()

        try {
          const ntriples = await resp.text()
              , { quads } = await parseToPromise(parser, ntriples)

          store.addQuads(quads)
        } catch (e) {
          throw new Error(`Could not parse changelog for data source ${backendURL}`)
        }

        const [ changeList ] = store.getObjects(null, ns('dc:provenance'))

        const changes = rdfListToArray(store, changeList)
          .map(getPatchRepr.bind(null, store, dataset))

        return changes
      },

      _: () => {
        throw new Error('not implemented');
      },
    })

    const patches = await patchesPromise

    const orcids = [].concat(...patches.map(p => [ p.submittedBy, p.mergedBy, p.updatedBy ]))
      .filter(x => x && x.includes('://orcid.org/'))

    await dispatch(LinkedDataAction.FetchORCIDs([ ...new Set(orcids) ]))

    const { nameByORCID } = getState().linkedData

    patches.forEach(p => {
      [ 'submittedBy', 'mergedBy', 'updatedBy' ].forEach(attr => {
        if (!p[attr]) return;

        p[attr] = nameByORCID[p[attr]]
          ? {
            url: p[attr],
            label: nameByORCID[p[attr]],
          }
          : { label: p[attr] }
      })
    })

    return { patches }
  }
}



function getPatch(storage, patchID) {
  return async (dispatch, getState, { db }) => {
    return await storage.case({
      IndexedDB: async backendID => {
        const patch = await db.localBackendPatches.get(parseInt(patchID))

        if (!patch) {
          throw new Error(`No such patch: ${patchID}`)
        }

        if (!patch.backendID === backendID) {
          throw new Error(`Patch ${patchID} is not a part of backend ${backendID}`)
        }

        const prevPatches = await db.localBackendPatches
          .where('backendID')
          .equals(backendID)
          .until(p => p.created === patch.created)
          .toArray()

        const prevRawDataset = emptyRawDataset()

        let postRawDataset = emptyRawDataset()

        prevPatches.forEach(patch => {
          const toApply = jsonpatch.deepClone(patch.forward)
          jsonpatch.applyPatch(prevRawDataset, toApply);
          jsonpatch.applyPatch(postRawDataset, toApply);
        })

        postRawDataset = jsonpatch.deepClone(postRawDataset)
        jsonpatch.applyPatch(postRawDataset, jsonpatch.deepClone(patch.forward))

        return {
          dataset: new DatasetProxy(postRawDataset),
          prevDataset: new DatasetProxy(prevRawDataset),
          patch,

          // FIXME: I added these for the Web backend but no the IndexedDB one.
          // They should be able to be added.
          change: {},
          position: {},
        }
      },
      Web: async () => {
        await dispatch(PatchAction.GetBackendHistory(storage))

        const changelog = getState().patches.byBackend[storage.asIdentifier()].history

        const [ change ] = changelog.filter(c => c.url === patchID)

        const index = changelog.indexOf(change)

        const [ prevRawDatasetReq, patchReq ] = await Promise.all([
          permalinkAwareFetch(change.sourceDatasetURL + '&inline-context', {
            headers: new Headers({
              Accept: 'application/json',
            }),
          }),
          permalinkAwareFetch(change.patchURL),
        ])

        const prevRawDataset = await prevRawDatasetReq.json()
            , patch = await patchReq.json()

        const postRawDataset = jsonpatch.deepClone(prevRawDataset)
        jsonpatch.applyPatch(postRawDataset, jsonpatch.deepClone(patch))

        return {
          dataset: new DatasetProxy(normalizeDataset(postRawDataset)),
          prevDataset: new DatasetProxy(normalizeDataset(prevRawDataset)),
          patch,
          change,
          position: {
            index,
            next: changelog[index + 1] || null,
            prev: changelog[index - 1] || null,
          },
        }
      },
      _: () => true,
    })
  }
}



function addPatchComment(backend, patchURL, comment) {
  let commentURL = patchURL

  if (!commentURL.endsWith('/')) commentURL += '/';
  commentURL += 'messages';

  return async dispatch => {
    const resp = await permalinkAwareFetch(commentURL, {
      body: JSON.stringify({ message: comment }),
      method: 'POST',
      headers: withAuthHeaders(backend, {
        'Content-Type': 'application/json',
      }),
    })

    switch (resp.status) {
    case 401: {
      const err = 'Bad authentication credentials. Sign out and sign back in.';
      throw new Error(err)
    }

    case 403: {
      const err = 'You do not have permission to comment'
      throw new Error(err)
    }

    default:
      if (!resp.ok) {
        const err = new Error('Error posting comment')
        err.resp = resp;
        throw err;
      }
    }

    // Refresh patch
    await dispatch(PatchAction.GetPatchRequest(backend, patchURL))

    return {}
  }
}

function decidePatchFate(backend, mergeURL, fate) {
  return async (dispatch, { db }) => {
    const actionURL = fate.case({
      Accept: () => mergeURL,
      Reject: () => mergeURL.replace('merge', 'reject'), // lol.
    })

    const gerund = fate.case({
      Accept: () => 'accepting',
      Reject: () => 'rejecting',
    })

    const resp = await permalinkAwareFetch(actionURL, {
      method: 'POST',
      headers: withAuthHeaders(backend, {
        'Content-Type': 'application/json', // necessary? probably not.
      }),
    })

    switch (resp.status) {
    case 401: {
      const err = 'Bad authentication credentials. Sign out and sign back in.';
      throw new Error(err)
    }

    case 403: {
      const err = 'You do not have permission to merge patches'
      throw new Error(err)
    }

    default:
      if (!resp.ok) {
        const err = new Error(`Error ${ gerund } change`)
        err.resp = resp;
        throw err;
      }
    }

    await dispatch(BackendAction.GetBackendDataset(backend.storage, true))

    await dispatch(PatchAction.GetPatchRequest(
      backend,
      mergeURL.replace('merge', '')
    ))

    // TODO: Update local skolem ids for new items (see code below)
    db;

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
