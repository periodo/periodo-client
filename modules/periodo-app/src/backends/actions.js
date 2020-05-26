"use strict";

const R = require('ramda')
    , url = require('url')
    , Type = require('union-type')
    , { normalizeDataset, isDataset } = require('periodo-utils').dataset
    , { formatPatch } = require('../patches/patch')
    , { Backend, BackendMetadata, BackendStorage, BackendBackup } = require('./types')
    , { NotImplementedError } = require('../errors')
    , { makeTypedAction, getResponse } = require('org-async-actions')
    , DatasetProxy = require('./dataset_proxy')

function isDatasetProxy(obj) {
  return obj instanceof DatasetProxy
}

function isRawDataset(obj) {
  return (
    isDataset(obj) &&
    !(obj instanceof DatasetProxy)
  )
}

const BackendAction = module.exports = makeTypedAction({
  GetAllBackends: {
    exec: listAvailableBackends,
    request: {},
    response: {
      backends: Type.ListOf(Backend),
    },
  },

  GetFileStorage: {
    exec: getFileStorage,
    request: {
      id: String,
    },
    response: {
      storage: BackendStorage,
    },
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
    },
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
    },
  },

  GenerateBackendExport: {
    exec: generateBackendExport,
    request: {
      storage: BackendStorage,
    },
    response: {
      backend: Object,
      patches: Object,
      dataset: Object,
      dexieVersion: Number,
    },
  },

  ImportBackend: {
    exec: importBackend,
    request: {
      backup: Object,
    },
    response: {},
  },

  UpdateLocalDataset: {
    exec: updateLocalDataset,
    request: {
      storage: BackendStorage,
      newRawDataset: isRawDataset,
      message: String,
    },
    response: {
      backend: Backend,
      dataset: isDatasetProxy,
      patchData: Object,
    },
  },

  UpdateBackend: {
    exec: updateBackend,
    request: {
      storage: BackendStorage,
      withObj: Object,
    },
    response: {},
  },

  AddOrcidCredential: {
    exec: addOrcidCredential,
    request: {
      storage: BackendStorage,
      token: String,
      name: String,
    },
    response: {},
  },

  RemoveOrcidCredential: {
    exec: removeOrcidCredential,
    request: {
      storage: BackendStorage,
    },
    response: {},
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
    response: {},
  },
})


const emptyRawDataset = () => ({
  authorities: {},
  type: 'rdf:Bag',
})

function listAvailableBackends() {
  return async (dispatch, getState, { db }) => {
    const backends = []

    const makeBackend = typeConstructor => item =>
      backends.push(Backend.BackendOf({
        storage: typeConstructor(item),
        metadata: BackendMetadata.BackendMetadataOf(item),
      }))

    await Promise.all([
      db.localBackends.each(makeBackend(BackendStorage.IndexedDBOf)),
      db.remoteBackends.each(makeBackend(BackendStorage.WebOf)),
      db.fileBackends.each(makeBackend(BackendStorage.StaticFileOf)),
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


function getFileStorage(id) {
  return async (dispatch, getState, { db }) => {
    let obj

    try {
      obj = await db.fileBackends.get(parseInt(id))
    } catch (e) {
      throw new Error(`No file data source with id ${id}`);
    }

    const storage = BackendStorage.StaticFile(parseInt(id), obj.file)

    await new Promise(resolve => {
      setTimeout(resolve, 500)
    })

    return { storage }
  }
}


function fetchBackend(storage, forceReload) {
  return async (dispatch, getState, { db }) => {
    const identifier = storage.asIdentifier()
        , existingDataset = R.path([ 'backends', 'datasets', identifier ], getState())

    if (existingDataset && !forceReload) {
      return {
        backend: R.path([ 'backends', 'available', identifier ], getState()),
        dataset: existingDataset,
      }
    }

    const [ metadata, rawDataset ] = await storage.case({
      IndexedDB: async id => {
        const ct = await db.localBackends
          .where('id')
          .equals(id)
          .modify({ accessed: new Date() })

        if (ct != 1) {
          throw new Error(`No in-browser data source with id ${id}`);
        }

        const backend = await db.localBackends.get(id)

        return [ backend, backend.dataset ]
      },

      Web: async url => {
        let metadata = await db.remoteBackends.get(url)

        const isSavedLocally = !!metadata
            , resp = await fetchServerResource(url, 'd.jsonld')
            , rawDataset = await resp.json()

        if (!isSavedLocally) {
          metadata = {
            label: 'Anonymous Web URL',
            description: '',
            created: resp.headers.get('Date'),
            modified: resp.headers.get('Last-Modified'),
            accessed: Date.now(),
          }
        } else {
          await db.remoteBackends
            .where('url')
            .equals(url)
            .modify({ accessed: new Date() })
        }

        return [ metadata, rawDataset ]
      },

      StaticFile: async (id, file) => {
        const ct = await db.fileBackends
          .where('id')
          .equals(id)
          .modify({ accessed: new Date() })

        if (ct != 1) {
          throw new Error(`No file data source with id ${id}`);
        }

        const backend = await db.fileBackends.get(id)

        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader()

          reader.onload = () => { resolve(reader.result) }
          reader.onerror = () => { reject(reader.error) }

          reader.readAsText(file)
        })

        const dataset = JSON.parse(text)

        return [ backend, dataset ]
      },

      Canonical: async url => {
        url;
        throw new NotImplementedError();
      },

      Memory: () => {
        throw new NotImplementedError();
      },
    })

    const dataset = new DatasetProxy(normalizeDataset(rawDataset))

    return {
      backend: Backend.BackendOf({
        storage,
        metadata: BackendMetadata.BackendMetadataOf(metadata),
      }),
      dataset,
    }
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
          throw new Error('Cannot create data source with existing IndexedDB.')
        }

        return db.localBackends
      },
      StaticFile: id => {
        if (id !== null) {
          throw new Error('Cannot create data source with existing file.')
        }

        return db.fileBackends
      },

      _: throwUnaddable,
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
      Web: () => ({
        url: storage.url,
      }),
      IndexedDB: () => ({
        dataset: emptyRawDataset(),
      }),
      StaticFile: (id, file) => ({
        file,
      }),
      _: () => null,
    }))

    const attemptPersist = await storage.case({
      IndexedDB: async () => {
        const checkIfPersisted = (
          typeof window !== 'undefined' &&
          'navigator' in window &&
          'storage' in window.navigator &&
          'persisted' in window.navigator.storage
        )

        if (!checkIfPersisted) return false

        const persisted = await window.navigator.storage.persisted()

        return !persisted
      },
      _: () => false,
    })

    if (attemptPersist) {
      await window.navigator.storage.persist()
    }

    const id = await table.add(backendObj);


    const backend = Backend.BackendOf({
      storage: storage.case({
        IndexedDB: () => BackendStorage.IndexedDB(id),
        StaticFile: () => BackendStorage.StaticFile(id, backendObj.file),
        _: () => storage,
      }),

      metadata: BackendMetadata.BackendMetadataOf(backendObj),
    })

    return { backend }
  }
}


function updateBackend(storage, withObj) {
  const updated = {
    modified: new Date(),
  }

  // Only allow editing "label" and "description" and "orcidCredential"
  if (withObj.label) {
    updated.label = withObj.label
  }

  if (withObj.description) {
    updated.description = withObj.description
  }

  if ('orcidCredential' in withObj) {
    updated.orcidCredential = withObj.orcidCredential
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

      _: () => null,
    })

    await dispatch(BackendAction.GetAllBackends)

    return {}
  }
}


function updateLocalDataset(storage, newRawDataset, message) {
  storage.case({
    IndexedDB: () => null,
    _: () => {
      throw new Error('Only in-browser data sources can be updated');
    },
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

    const patchData = formatPatch(dataset.raw, newRawDataset, message)

    const updatedBackend = {
      ...backend.metadata,
      ...backend.storage,
      dataset: newRawDataset,
      modified: new Date().getTime(),
    }

    delete updatedBackend._name;
    delete updatedBackend._keys;

    await db.localBackends.put(updatedBackend);

    await db.localBackendPatches.add({
      backendID: backend.storage.id,
      ...patchData,
    })

    await _refetch()

    return {
      backend,
      dataset: new DatasetProxy(newRawDataset),
      patchData,
    }
  }
}


function generateBackendExport(storage) {
  return async (dispatch, getState, { db }) => {
    let id

    storage.case({
      IndexedDB: _id => { id = _id },
      _: () => {
        throw new Error(
          `Cannot export data source of type ${storage._type}.`
        )
      },
    })

    const backend = await db.localBackends.get(id)

    const patches = await db.localBackendPatches
      .where('backendID')
      .equals(id)
      .toArray()

    delete backend.id
    delete backend.orcidCredential

    patches.forEach(patch => {
      delete patch.id
      delete patch.backendID
    })

    const { dataset } = backend

    delete backend.dataset

    const backup = {
      backend,
      dataset,
      patches,
      dexieVersion: db.verno,
    }

    return backup
  }
}


function importBackend(backupData) {
  return async (dispatch, getState, { db }) => {
    let backup

    try {
      backup = BackendBackup.fromObject(backupData)
    } catch (e) {
      throw new Error('Not a valid backup')
    }

    // TODO: Deal with dexie versions, if we ever go past the one now

    const { metadata, dataset, patches } = stripUnionTypeFields(backup)

    let backendID

    await db.transaction('rw', db.localBackends, db.localBackendPatches, async () => {
      backendID = await db.localBackends.add({
        ...metadata,
        dataset,
      })

      const patchesWithBackend = patches.map(patch => ({
        ...patch,
        backendID,
      }))

      db.localBackendPatches.bulkAdd(patchesWithBackend)
    })

    const storage = BackendStorage.IndexedDB(backendID)

    await dispatch(BackendAction.GetAllBackends)
    await dispatch(BackendAction.GetBackendDataset(storage, true))

    return {}
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

      StaticFile: id =>
        db.localBackends
          .where('id')
          .equals(id)
          .delete(),

      _: () => {
        throw new Error(
          `Backend of type ${storage._type} is not meant to be deleted.`
        )
      },
    })

    if (ct === 0) {
      // FIXME: nothing was deleted? Raise an error?
    }

    return {}
  }
}

function addOrcidCredential(storage, token, name) {
  return async dispatch => {
    storage.case({
      Web: () => null,
      _: () => {
        throw new Error('Only Web data sources contain ORCID credentials')
      },
    })

    await dispatch(BackendAction.UpdateBackend(storage, {
      orcidCredential: {
        token,
        name,
      },
    }))

    return {}
  }
}

function removeOrcidCredential(storage) {
  return async dispatch => {
    await dispatch(BackendAction.UpdateBackend(storage, {
      orcidCredential: null,
    }))

    return {}
  }
}

function deleteAllBackends() {
  return async (dispatch, getState, { db }) => {
    await db.delete()

    return {}
  }
}
