"use strict";

const R = require('ramda')
    , { formatPatch } = require('../patches/utils/patch')
    , { Backend, BackendAction, BackendMetadata, BackendStorage } = require('./types')
    , { NotImplementedError } = require('../errors')
    , { getResponse } = require('../typed-actions/utils')


const emptyDataset = () => ({
  periodCollections: {},
  type: 'rdf:Bag'
})

function listAvailableBackends() {
  const action = BackendAction.GetAllBackends()

  return action.do(async (dispatch, getState, { db }) => {
    const backends = []

    const addBackend = typeConstructor => item =>
      backends.push(Backend.BackendOf({
        storage: typeConstructor(item),
        metadata: BackendMetadata.BackendMetadataOf(item)
      }))

    await Promise.all([
      db.localBackends.each(addBackend(BackendStorage.IndexedDBOf)),
      db.remoteBackends.each(addBackend(BackendStorage.WebOf)),
    ])

    return { backends }
  })
}

async function fetchDataset(url) {
  const resp = await fetch(url + 'd.jsonld');

  if (!resp.ok) {
    throw new Error(
    `Failed to fetch backend at ${url}.` +
    '\n' +
    `${resp.status} ${resp.statusText}`)
  }

  return resp;
}

function fetchBackend(storage, forceReload) {
  const action = BackendAction.GetBackend(storage)

  return action.do(async (dispatch, getState, { db }) => {
    const identifier = storage.asIdentifier()
        , existing = R.path(['backends', 'loaded', identifier], getState())

    if (existing && !forceReload) return existing

    const [metadata, dataset] = await storage.case({
      IndexedDB: id =>
        db.localBackends.get(id)
          .then(
            backendObj => [backendObj, backendObj.dataset],
            err => {
              // FIXME: better error handlign
              err;
              throw new Error('No backend with params ... ');
            }),

      Web: async url => {
        let metadata = await db.remoteBackends.get(url)

        const isSavedLocally = !!metadata
            , resp = await fetchDataset(url)
            , dataset = await resp.json()

        if (!isSavedLocally) {
          metadata = {
            label: 'Anonymous Web URL',
            description: '',
            created: resp.headers.get('Date'),
            modified: resp.headers.get('Last-Modified'),
            accessed: Date.now()
          }
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
    });

    return {
      backend: Backend.BackendOf({
        storage,
        metadata: BackendMetadata.BackendMetadataOf(metadata)
      }),
      dataset,
    }
  })
}


function addBackend(storage, label='', description='') {
  const action = BackendAction.CreateBackend(storage, label, description)

  const throwUnaddable = () => {
    throw new Error(
      `Backend of type ${storage._name} is not meant to be created.`
    )
  }

  return action.do(async (dispatch, getState, { db }) => {
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
  })
}

function updateLocalBackendDataset(storage, newDataset, message) {
  const action = BackendAction.UpdateBackend(storage, newDataset)

  storage.case({
    IndexedDB: () => null,
    _: () => {
      throw new Error('Only indexedDB backends can be updated');
    }
  })

  return action.do((dispatch, getState, { db }) =>
    db.transaction('rw', db.localBackends, db.localBackendPatches, async () => {
      let backend, dataset

      async function _refetch() {
        const fetchAction = await dispatch(fetchBackend(storage, true))
            , resp = getResponse(fetchAction)

        backend = resp.backend;
        dataset = resp.dataset;
      }

      await _refetch()

      const patchData = formatPatch(dataset, newDataset, message)

      const updatedBackend = Object.assign({}, backend.metadata, backend.storage, {
        dataset: newDataset,
        modified: new Date().getTime()
      })

      delete updatedBackend._name;
      delete updatedBackend._keys;

      await db.localBackends.put(updatedBackend);

      await db.localBackendPatches.add(Object.assign({
        backendID: backend.id
      }, patchData))

      await _refetch()

      return {
        backend,
        dataset,
        patchData
      }
    }))
}


function deleteBackend(storage) {
  const action = BackendAction.DeleteBackend(storage)

  return action.do(async (dispatch, getState, { db }) => {
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
          `Backend of type ${action._type} is not meant to be deleted.`
        )
      }
    })

    if (ct === 0) {
      // FIXME: nothing was deleted? Raise an error?
    }

    return {}
  })
}

module.exports = {
  listAvailableBackends,
  fetchBackend,
  addBackend,
  updateLocalBackendDataset,
  deleteBackend,
}
