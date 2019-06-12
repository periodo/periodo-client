"use strict";

const R = require('ramda')
    , N3 = require('n3')
    , url = require('url')
    , ns = require('lov-ns')
    , jsonpatch = require('fast-json-patch')
    , Type = require('union-type')
    , { normalizeDataset } = require('periodo-utils').dataset
    , { formatPatch } = require('../patches/patch')
    , { Backend, BackendMetadata, BackendStorage } = require('./types')
    , { NotImplementedError } = require('../errors')
    , { makeTypedAction, getResponse } = require('org-async-actions')
    , LinkedDataAction = require('../linked-data/actions')
    , { rdfListToArray } = require('org-n3-utils')
    , { getPatchRepr } = require('../linked-data/utils/patch')
    , parseJSONLD = require('../linked-data/utils/parse_jsonld')
    , DatasetProxy = require('./dataset_proxy')

function isDatasetProxy(obj) {
  return obj instanceof DatasetProxy
}

const BackendAction = module.exports = makeTypedAction({
  GetAllBackends: {
    exec: listAvailableBackends,
    request: {},
    response: {
      backends: Type.ListOf(Backend),
    }
  },

  GetBackendDataset: {
    exec: fetchBackend,
    request: {
      storage: BackendStorage,
      forceReload: Boolean,
    },
    response: {
      backend: Backend,
      dataset: isDatasetProxy,
    }
  },

  GetBackendHistory: {
    exec: fetchBackendHistory,
    request: {
      storage: BackendStorage,
    },
    response: {
      // TODO: make this "patch" type
      patches: Type.ListOf(Object)
    }
  },

  GetBackendPatch: {
    exec: fetchBackendPatch,
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
    }
  },

  CreateBackend: {
    exec: addBackend,
    request: {
      storage: BackendStorage,
      label: String,
      description: String,
    },
    response: {
      backend: Backend,
    }
  },

  UpdateLocalDataset: {
    exec: updateLocalDataset,
    request: {
      storage: BackendStorage,
      newDataset: isDatasetProxy,
      message: String,
    },
    response: {
      backend: Backend,
      dataset: isDatasetProxy,
      patchData: Object,
    }
  },

  UpdateBackend: {
    exec: updateBackend,
    request: {
      storage: BackendStorage,
      withObj: Object,
    },
    response: {
      backend: Backend,
    }
  },

  DeleteAllBackends: {
    exec: deleteAllBackends,
    request: {},
    response: {},
  },

  DeleteBackend: {
    exec: deleteBackend,
    request: {
      storage: BackendStorage,
    },
    response: {}
  },
})


const emptyDataset = () => ({
  authorities: {},
  type: 'rdf:Bag'
})

function listAvailableBackends() {
  return async (dispatch, getState, { db }) => {
    const backends = []

    const makeBackend = typeConstructor => item =>
      backends.push(Backend.BackendOf({
        storage: typeConstructor(item),
        metadata: BackendMetadata.BackendMetadataOf(item)
      }))

    await Promise.all([
      db.localBackends.each(makeBackend(BackendStorage.IndexedDBOf)),
      db.remoteBackends.each(makeBackend(BackendStorage.WebOf)),
    ])

    return { backends }
  }
}

function ensureTrailingSlash(url) {
  return url.slice(-1) === '/' ? url : url + '/';
}

async function fetchServerResource(baseURL, resourceName) {
  const resolvedURL = url.resolve(ensureTrailingSlash(baseURL), resourceName)

  const headers = new Headers()
  headers.append('Accept', 'application/json')

  const resp = await fetch(resolvedURL, { headers })

  if (!resp.ok) {
    throw new Error(
    `Failed to fetch resource at ${url}.` +
    '\n' +
    `${resp.status} ${resp.statusText}`)
  }

  return resp;
}


function fetchBackend(storage, forceReload) {
  return async (dispatch, getState, { db }) => {
    const identifier = storage.asIdentifier()
        , existingDataset = R.path(['backends', 'datasets', identifier], getState())

    if (existingDataset && !forceReload) {
      return {
        backend: R.path(['backends', 'available', identifier], getState()),
        dataset: existingDataset
      }
    }

    const [ metadata, dataset ] = await storage.case({
      IndexedDB: async id => {
        const ct = await db.localBackends
          .where('id')
          .equals(id)
          .modify({ accessed: new Date() })

        if (ct != 1) {
          throw new Error(`No local backend with id ${id}`);
        }

        const backend = await db.localBackends.get(id)

        return [backend, backend.dataset]
      },

      Web: async url => {
        let metadata = await db.remoteBackends.get(url)

        const isSavedLocally = !!metadata
            , resp = await fetchServerResource(url, 'd.jsonld')
            , dataset = await resp.json()

        if (!isSavedLocally) {
          metadata = {
            label: 'Anonymous Web URL',
            description: '',
            created: resp.headers.get('Date'),
            modified: resp.headers.get('Last-Modified'),
            accessed: Date.now()
          }
        } else {
          await db.remoteBackends
            .where('url')
            .equals(url)
            .modify({ accessed: new Date() })
        }

        return [metadata, dataset]
      },

      Canonical: async url => {
        url;
        throw new NotImplementedError();
      },

      Memory: () => {
        throw new NotImplementedError();
      },
    })

    return {
      backend: Backend.BackendOf({
        storage,
        metadata: BackendMetadata.BackendMetadataOf(metadata)
      }),
      dataset: new DatasetProxy(normalizeDataset(dataset))
    }
  }
}

function fetchBackendPatch(storage, patchID) {
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

        const prevDataset = emptyDataset()

        let postDataset = emptyDataset()

        prevPatches.forEach(patch => {
          const toApply = jsonpatch.deepClone(patch.forward)
          jsonpatch.applyPatch(prevDataset, toApply);
          jsonpatch.applyPatch(postDataset, toApply);
        })

        postDataset = jsonpatch.deepClone(postDataset)
        jsonpatch.applyPatch(postDataset, jsonpatch.deepClone(patch.forward))

        return {
          dataset: new DatasetProxy(postDataset),
          prevDataset: new DatasetProxy(prevDataset),
          patch,

          // FIXME: I added these for the Web backend but no the IndexedDB one.
          // They should be able to be added.
          change: {},
          position: {},
        }
      },
      Web: async () => {
        await dispatch(BackendAction.GetBackendHistory(storage))

        const changelog = getState().backends.patches[storage.asIdentifier()]

        const [ change ] = changelog.filter(c => c.url === patchID)

        const index = changelog.indexOf(change)

        const [ prevDatasetReq, patchReq ] = await Promise.all([
          fetch(change.sourceDatasetURL, {
            headers: new Headers({
              Accept: 'application/json',
            })
          }),
          fetch(change.patchURL),
        ])

        const prevDataset = await prevDatasetReq.json()
            , patch = await patchReq.json()

        const postDataset = jsonpatch.deepClone(prevDataset)
        jsonpatch.applyPatch(postDataset, jsonpatch.deepClone(patch))

        return {
          dataset: new DatasetProxy(normalizeDataset(postDataset)),
          prevDataset: new DatasetProxy(normalizeDataset(prevDataset)),
          patch,
          change,
          position: {
            index,
            next: changelog[index + 1] || null,
            prev: changelog[index - 1] || null,
          }
        }
      },
      _: R.T,
    })
  }
}


function fetchBackendHistory(storage) {
  return async (dispatch, getState, { db }) => {
    const datasetPromise = dispatch(BackendAction.GetBackendDataset(storage, false))

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
          patch: p.forward,
        }))
      },

      Web: async url => {
        const resp = await fetchServerResource(url, 'history.jsonld?inline-context')
            , data = await resp.json()
            , store = new N3.Store()

        const { quads } = await parseJSONLD(data)

        store.addQuads(quads);

        const [ changeList ] = store.getObjects(null, ns('dcterms:provenance'))

        const changes = rdfListToArray(store, changeList)
          .map(getPatchRepr.bind(null, store))

        return R.sortBy(R.prop('time'), changes);
      },

      _: () => {
        throw new Error('not implemented');
      }
    })

    const [, patches ] = await Promise.all([ datasetPromise, patchesPromise ])

    const orcids = [...new Set(R.pipe(
      R.chain(p => [p.submittedBy, p.mergedBy, p.updatedBy].filter(R.identity)),
      R.filter(R.contains('://orcid.org/'))
    )(patches))]

    await dispatch(LinkedDataAction.FetchORCIDs(orcids))

    const { nameByORCID } = getState().linkedData

    patches.forEach(p => {
      ['submittedBy', 'mergedBy', 'updatedBy'].forEach(attr => {
        if (!p[attr]) return;

        p[attr] = nameByORCID[p[attr]]
          ? { url: p[attr], label: nameByORCID[p[attr]] }
          : { label: p[attr] }
      })
    })

    return { patches }
  }
}


function addBackend(storage, label='', description='') {
  const throwUnaddable = () => {
    throw new Error(
      `Backend of type ${storage._name} is not meant to be created.`
    )
  }

  return async (dispatch, getState, { db }) => {
    const table = storage.case({
      Web: () => db.remoteBackends,
      IndexedDB: id => {
        if (id !== null) {
          throw new Error('Cannot create backend with existing IndexedDB.')
        }

        return db.localBackends
      },
      _: throwUnaddable
    })

    const now = new Date().getTime()

    const backendObj = {
      label,
      description,
      created: now,
      modified: now,
      accessed: now,
    }

    Object.assign(backendObj, storage.case({
      Web: () => ({ url: storage.url }),
      IndexedDB: () => ({ dataset: emptyDataset() }),
      _: () => null,
    }))

    const id = await table.add(backendObj);


    const backend = Backend.BackendOf({
      storage: storage.case({
        IndexedDB: () => BackendStorage.IndexedDB(id),
        _: () => storage,
      }),

      metadata: BackendMetadata.BackendMetadataOf(backendObj)
    })

    return { backend }
  }
}


function updateBackend(storage, withObj) {
  const updated = {
    modified: new Date()
  }

  // Only allow editing "label" and "description"
  if (withObj.label) {
    updated.label = withObj.label
  }

  if (withObj.description) {
    updated.description = withObj.description
  }

  return async (dispatch, getState, { db }) => {
    await storage.case({
      IndexedDB: id => {
        return db.localBackends
          .where('id')
          .equals(id)
          .modify(updated)
      },

      Web: url => {
        return db.remoteBackends
          .where('url')
          .equals(url)
          .modify(updated)
      },

      _: () => null
    })

    const fetchAction = await dispatch(BackendAction.GetBackendDataset(storage, false))
        , { backend } = getResponse(fetchAction)

    return { backend }
  }
}


function updateLocalDataset(storage, newDataset, message) {
  storage.case({
    IndexedDB: () => null,
    _: () => {
      throw new Error('Only indexedDB backends can be updated');
    }
  })

  return async (dispatch, getState, { db }) => {
    let backend, dataset

    async function _refetch() {
      const action = await dispatch(BackendAction.GetBackendDataset(storage, true))
          , resp = getResponse(action)

      backend = resp.backend;
      dataset = resp.dataset;
    }

    await _refetch()

    const patchData = formatPatch(dataset.raw, newDataset, message)

    const updatedBackend = Object.assign({}, backend.metadata, backend.storage, {
      dataset: newDataset,
      modified: new Date().getTime()
    })

    delete updatedBackend._name;
    delete updatedBackend._keys;

    await db.localBackends.put(updatedBackend);

    await db.localBackendPatches.add(Object.assign({
      backendID: backend.storage.id
    }, patchData))

    await _refetch()

    return {
      backend,
      dataset,
      patchData,
    }
  }
}


function deleteBackend(storage) {
  return async (dispatch, getState, { db }) => {
    const ct = await storage.case({
      Web: url =>
        db.remoteBackends
          .where('url')
          .equals(url)
          .delete(),

      IndexedDB: id =>
        db.localBackends
          .where('id')
          .equals(id)
          .delete(),

      _: () => {
        throw new Error(
          `Backend of type ${storage._type} is not meant to be deleted.`
        )
      }
    })

    if (ct === 0) {
      // FIXME: nothing was deleted? Raise an error?
    }

    return {}
  }
}

function deleteAllBackends() {
  return async (dispatch, getState, { db }) => {
    await db.localBackends.clear()
    await db.remoteBackends.clear()

    return {}
  }
}
