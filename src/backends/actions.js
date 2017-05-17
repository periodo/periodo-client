"use strict";

const { formatPatch } = require('../patches/utils/patch')
    , { Backend, BackendAction, BackendMetadata } = require('./types')
    , { makeEmptyDataset } = require('./utils')

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
          .concat(localBackends.map(obj => ({
            type: Backend.IndexedDBOf(obj),
            metadata: BackendMetadata.BackendMetadataOf(obj)
          })))
          .concat(remoteBackends.map(obj => ({
            type: Backend.WebOf(obj),
            metadata: BackendMetadata.BackendMetadataOf(obj)
          })))
    }
  })
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
        let metadata = await db.remoteBackends
          .where('url')
          .equals(url)
          .get()

        const isSavedLocally = !!metadata

        const resp = await fetch(url);

        if (!resp.ok) {
          throw new Error(
          `Failed to fetch backend at ${url}.` +
          '\n' +
          `${resp.status} ${resp.statusText}`)
        }

        const dataset = await resp.json();

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
      }
    });

    return {
      type: backend,
      metadata,
      dataset,
      setAsActive,
    }
  })
}


// backend should be a Backend record
function addBackend(backend, label='', description='') {
  const action = BackendAction.CreateBackend(backend, label, description)

  return action.do(async (dispatch, getState, { db }) => {
    const table = backend.case({
      Web: () => db.remoteBackends,
      IndexedDB: () => db.localBackends,
      _: () => {
        throw new Error(
          `Backend of type ${action._type} is not meant to be created.`
        )
      }
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
      IndexedDB: () => ({ dataset: makeEmptyDataset() }),
    }));

    const id = await table.add(backendObj);

    return {
      backend: backend.case({
        Web: () => backend,
        IndexedDB: () => Backend.IndexedDB(id)
      }),

      metadata: BackendMetadata.BackendMetadataOf(metadata)
    }
  })
}

function updateLocalBackendDataset(backend, updatedDataset, message) {
  const action = BackendAction.UpdateBackend(backend, updatedDataset)

  return action.do((dispatch, getState, { db }) =>
    db.transaction('rw', db.localBackends, db.localBackendPatches, async () => {
      const resp = await(dispatch(fetchBackend(backend)))
          , { metadata, dataset } = resp.readyState.response
          , patchData = formatPatch(dataset, updatedDataset, message)
          , now = new Date().getTime()

      const updatedBackend = Object.assign({}, metadata, {
        dataset: updatedDataset,
        modified: now
      })

      await db.localBackends.put(updatedBackend);

      await db.localBackendPatches.add(Object.assign({
        backendID: backend.id
      }, patchData))

      return;
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
  })
}

module.exports = {
  listAvailableBackends,
  fetchBackend,
  addBackend,
  updateLocalBackendDataset,
  deleteBackend,
}
