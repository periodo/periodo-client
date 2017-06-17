"use strict";

const { formatPatch } = require('../patches/utils/patch')
    , { Backend, BackendAction, BackendMetadata } = require('./types')
    , { makeEmptyDataset } = require('./utils')
    , { NotImplementedError } = require('../errors')
    , { getResponse } = require('../typed-actions/utils')

function makeBackend(typeConstructor) {
  return obj => ({
    type: typeConstructor(obj),
    metadata: BackendMetadata.BackendMetadataOf(obj)
  })
}

function listAvailableBackends() {
  const action = BackendAction.GetAllBackends()

  return action.do(async (dispatch, getState, { db }) => {
    let localBackends, remoteBackends

    await db.transaction('r', db.localBackends, db.remoteBackends, async () => {
      [localBackends, remoteBackends] = await Promise.all([
        db.localBackends.toArray(),
        db.remoteBackends.toArray(),
      ])
    })

    return {
        backends: []
          .concat(localBackends.map(makeBackend(Backend.IndexedDBOf)))
          .concat(remoteBackends.map(makeBackend(Backend.WebOf)))
    }
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

function fetchBackend(backend, setAsActive=false) {
  const action = BackendAction.GetBackendOf({
    backend,
    setAsActive,
  })

  return action.do(async (dispatch, getState, { db }) => {
    const [metadata, dataset] = await backend.case({
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

      UnsavedIndexedDB: () => {
        throw new Error('Unsaved indexedDB cannot be fetched.');
      }
    });

    return {
      type: backend,
      metadata: BackendMetadata.BackendMetadataOf(metadata),
      isEditable: backend.case({
        IndexedDB: () => true,
        _: () => false,
      }),
      dataset,
      setAsActive,
    }
  })
}


// backend should be a Backend record
function addBackend(backend, label='', description='') {
  const action = BackendAction.CreateBackend(backend, label, description)

  const throwUnaddable = () => {
      throw new Error(
        `Backend of type ${backend._name} is not meant to be created.`
      )
  }

  return action.do(async (dispatch, getState, { db }) => {
    const table = backend.case({
      Web: () => db.remoteBackends,
      UnsavedIndexedDB: () => db.localBackends,
      _: throwUnaddable
    })

    const now = new Date().getTime()

    const metadata = {
      label,
      description,
      created: now,
      modified: now,
      accessed: now
    }


    const backendObj = Object.assign({}, metadata, backend.case({
      Web: () => ({ url: backend.url }),
      UnsavedIndexedDB: () => ({ dataset: makeEmptyDataset() }),
      _: throwUnaddable
    }));

    const id = await table.add(backendObj);

    return {
      backend: backend.case({
        Web: () => backend,
        UnsavedIndexedDB: () => Backend.IndexedDB(id),
        _: throwUnaddable
      }),

      metadata: BackendMetadata.BackendMetadataOf(metadata)
    }
  })
}

function updateLocalBackendDataset(backend, updatedDataset, message) {
  const action = BackendAction.UpdateBackend(backend, updatedDataset)

  backend.case({
    IndexedDB: () => null,
    _: () => {
      throw new Error('Only indexedDB backends can be updated');
    }
  })

  return action.do((dispatch, getState, { db }) =>
    db.transaction('rw', db.localBackends, db.localBackendPatches, async () => {
      let metadata, dataset

      async function _refetch() {
        const fetchAction = await dispatch(fetchBackend(backend))
            , resp = getResponse(fetchAction)

        metadata = resp.metadata;
        dataset = resp.dataset;
      }

      await _refetch()

      const patchData = formatPatch(dataset, updatedDataset, message)
          , now = new Date().getTime()

      const updatedBackend = Object.assign({}, metadata, {
        id: backend.id,
        dataset: updatedDataset,
        modified: now
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
        metadata,
        patchData
      }
    }))
}


function deleteBackend(backend) {
  const action = BackendAction.DeleteBackend(backend)

  return action.do(async (dispatch, getState, { db }) => {
    const ct = await backend.case({
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
