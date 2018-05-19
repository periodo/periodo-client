"use strict";

const R = require('ramda')
    , N3 = require('n3')
    , url = require('url')
    , ns = require('../linked-data/ns')
    , jsonpatch = require('fast-json-patch')
    , jsonld = require('jsonld')
    , { Route } = require('org-shell')
    , { formatPatch } = require('../patches/patch')
    , { Backend, BackendAction, BackendMetadata, BackendStorage } = require('./types')
    , { NotImplementedError } = require('../errors')
    , { getResponse } = require('../typed-actions/utils')
    , { fetchORCIDs } = require('../linked-data/actions')
    , parseJSONLD = require('../linked-data/utils/parse_jsonld')


const emptyDataset = () => ({
  periodCollections: {},
  type: 'rdf:Bag'
})


function listAvailableBackends() {
  const action = BackendAction.GetAllBackends

  return action.do(async (dispatch, getState, { db }) => {
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
  })
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
  const action = BackendAction.GetBackendDataset(storage)

  return action.do(async (dispatch, getState, { db }) => {
    const identifier = storage.asIdentifier()
        , existingDataset = R.path(['backends', 'datasets', identifier], getState())

    if (existingDataset && !forceReload) {
      return {
        backend: R.path(['backends', 'available', identifier], getState()),
        dataset: existingDataset
      }
    }

    const [metadata, dataset] = await storage.case({
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

function fetchBackendPatch(storage, patchID) {
  const action = BackendAction.GetBackendPatch(storage, patchID)

  return action.do(async (dispatch, getState, { db }) => {
    const ret = await storage.case({
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
          dataset: postDataset,
          prevDataset,
          patch,
        }
      },
      _: R.T,
    })

    return ret;
  })
}


function fetchBackendHistory(storage) {
  const action = BackendAction.GetBackendHistory(storage)

  return action.do(async (dispatch, getState, { db }) => {
    const datasetPromise = dispatch(fetchBackend(storage))

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
        const resp = await fetchServerResource(url, 'history.jsonld')
            , data = await resp.json()
            , store = N3.Store()

        const { triples, prefixes } = await parseJSONLD(data)

        store.addPrefixes({
          'prov': 'http://www.w3.org/ns/prov#'
        })
        store.addTriples(triples);

        const changes = await Promise.all(store.getSubjects('prov:generated').map(async url => {
          const framed = await jsonld.promises.frame(data, {
            '@context': R.omit(['@base'], data['@context']),
            '@id': url,
          })

          const patch = framed['history'][0]

          const roles = R.pipe(
            R.groupBy(r => r.role.split('#')[1] + 'By'),
            R.map(r => r[0]['prov:agent']['@id'].replace('http://', 'https://'))
          )(patch.roles || [])

          let [patchURL, sourceDatasetURL] =
            ('url' in patch.used[0]) ? patch.used : patch.used.reverse()

          patchURL = patchURL.url.split('p0')[1]
          sourceDatasetURL = sourceDatasetURL['@id'].split('p0')[1]

          return R.merge(roles, {
            url,
            patchURL,
            sourceDatasetURL,
            time: R.pipe(
              () => store.getObjects(url, 'prov:startedAtTime'),
              R.head,
              N3.Util.getLiteralValue,
            )(),
          })
        }))

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

    await dispatch(fetchORCIDs(orcids))

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


function updateBackend(storage, withObj) {
  const action = BackendAction.UpdateBackend(storage, withObj)

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

  return action.do(async (dispatch, getState, { db }) => {
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

    const fetchAction = await dispatch(fetchBackend(storage, true))
        , { backend } = getResponse(fetchAction)

    return { backend }
  })
}


function updateLocalDataset(storage, newDataset, message) {
  const action = BackendAction.UpdateLocalDataset(storage, newDataset)

  storage.case({
    IndexedDB: () => null,
    _: () => {
      throw new Error('Only indexedDB backends can be updated');
    }
  })

  return action.do(async (dispatch, getState, { db }) => {
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
      backendID: backend.storage.id
    }, patchData))

    await _refetch()

    return {
      backend,
      dataset,
      patchData
    }
  })
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
  fetchBackendHistory,
  fetchBackendPatch,
  addBackend,
  updateBackend,
  updateLocalDataset,
  deleteBackend,
}
