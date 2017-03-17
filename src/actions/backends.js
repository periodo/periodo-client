const patchUtils = require('../utils/patch')
    , parseURL = require('url').parse
    , { Backend } = require('../records')
    , { bindRequestAction } = require('./requests')
    , { RETHROW_ERRORS } = global


const {
  GET_ALL_BACKENDS,

  GET_BACKEND,
  CREATE_BACKEND,
  UPDATE_BACKEND,
  DELETE_BACKEND,

} = require('../types').actions

const backendTypes = require('../types').backends

const {
  PENDING,
  SUCCESS,
  FAILURE,
} = require('../types').readyStates


function makeBackend(type) {
  return backend => new Backend(backend).set('type', type)
}


function listAvailableBackends() {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(dispatch, GET_ALL_BACKENDS)

    dispatchReadyState(PENDING);

    return db.transaction('r', db.localBackends, db.remoteBackends, () => {
      return db.localBackends.toArray(localBackends =>
        db.remoteBackends.toArray(remoteBackends => {
          const backends = []
            .concat(localBackends.map(makeBackend(backendTypes.INDEXED_DB)))
            .concat(remoteBackends.map(makeBackend(backendTypes.WEB)))

          return dispatchReadyState(SUCCESS, { responseData: { backends }});
        })
      )
      .catch(error => {
        if (RETHROW_ERRORS) {
          throw error;
        }

        return dispatchReadyState(FAILURE, { error });
      })
    })
  }
}


function getBackendWithDataset({ id, url, type }, setAsActive=false) {
  return (dispatch, getState, { db }) => {
    let promise

    const dispatchReadyState = bindRequestAction(dispatch, GET_BACKEND)

    dispatchReadyState(PENDING, { setAsActive })

    switch (type) {
      case backendTypes.INDEXED_DB:
        promise = db.localBackends
          .where('id')
          .equals(id)
          .toArray()
          .then(([backend]) => {
            if (!backend) {
              throw Error(`No existing local backend with id ${id}`)
            }

            return [backend, backend.dataset]
          })
        break;

      case backendTypes.WEB:
        promise = db.remoteBackends
          .where('url')
          .equals(url)
          .toArray()
          .then(([backend]) => {
            if (!backend) {
              backend = { type: backendTypes.WEB_ANONYMOUS, url }
            }

            return backend;
          })
          .then(backend => fetch(url).then(resp => {
            if (!resp.ok) {
              throw new Error(
              `Failed to fetch backend at ${url}.` +
              '\n' +
              `${resp.status} ${resp.statusText}`)
            }

          backend.modified = resp.headers.get('Last-Modified');

          return resp.json().then(dataset => [backend, dataset])
        }))
        break;

      default:
        throw Error(`No way to fetch backend with type ${type}.`)
    }

    return promise.then(([backend, dataset]) => {
      const responseData = {
        backend,
        dataset
      }

      dispatchReadyState(SUCCESS, { responseData, setAsActive });

      return responseData;
    })
    .catch(error => {
      if (RETHROW_ERRORS) {
        throw error;
      }

      dispatchReadyState(FAILURE, { error, setAsActive });
    })
  }
}


// backend should be a Backend record
function addBackend({ type, label='', description='', url=null }) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(dispatch, CREATE_BACKEND)
        , isIDB = type === backendTypes.INDEXED_DB

    let backendObject
      , payload
      , dataset = null

    return Promise.resolve()
      .then(() => {
        payload = {
          type,
          label,
          description,
        }

        switch (type) {
          case backendTypes.WEB: {
            if (!url) {
              throw new Error('Cannot add a Web backend without a URL.');
            }

            const { protocol, host } = parseURL(url)

            if (!(protocol && host)) {
              throw new Error(`Invalid URL: ${url}`);
            }

            payload.url = url;
            break;
          }

          case backendTypes.INDEXED_DB: {
            dataset = {
              periodCollections: {},
              type: 'rdf:Bag'
            }
            break;
          }

          default: {
            throw new Error('Invalid backend type');
          }
        }

        const table = type === backendTypes.WEB
          ? db.remoteBackends
          : db.localBackends

        const now = new Date().getTime()

        const metadata = {
          created: now,
          modified: now,
          accessed: now
        }


        dispatchReadyState(PENDING, { payload });

        backendObject = Object.assign({ dataset }, payload, metadata)

        return table.add(backendObject);
      })
      .then(
        id => dispatchReadyState(SUCCESS, {
          responseData: {
            backend: Object.assign(isIDB ? { id } : {}, backendObject)
          }
        }),
        error => dispatchReadyState(FAILURE, {
          payload,
          error
        })
      )
  }
}

function updateLocalBackendDataset({ id, updatedDataset, message }) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(dispatch, UPDATE_BACKEND)

    let updatedBackend
      , patchData

    return Promise.resolve().then(() => {
      const payload = { id, updatedDataset, message }

      dispatchReadyState(PENDING, { payload });

      return db.transaction('rw', db.localBackends, db.localBackendPatches, () => {
        return dispatch(getBackendWithDataset({ id, type: backendTypes.INDEXED_DB }))
          .then(({ backend, dataset }) => {
            const now = new Date().getTime()

            patchData = patchUtils.formatPatch(dataset, updatedDataset, message)

            updatedBackend = Object.assign({}, backend, {
              dataset: updatedDataset,
              modified: now
            })

            return db.localBackends.put(updatedBackend).then(() =>
              db.localBackendPatches.add(Object.assign({ backendID: backend.id }, patchData)))
          })
        })
      })
      .then(
        resp => dispatchReadyState(SUCCESS, {
          responseData: {
            backend: updatedBackend,
            patchData
          }
        }),
        error => {
          if (RETHROW_ERRORS) {
            throw error;
          }

          return dispatchReadyState(FAILURE, { error })
        }
      )
  }
}


function deleteBackend({ id, url, type }) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(dispatch, DELETE_BACKEND)

    dispatchReadyState(PENDING);

    let promise

    switch (type) {
      case backendTypes.INDEXED_DB: {
        promise = db.localBackends
          .where('id')
          .equals(id)
          .delete()

        break;
      }

      case backendTypes.WEB: {
        promise = db.remoteBackends
          .where('url')
          .equals(url)
          .delete()

        break;
      }
      default: {
        throw new Error(`Cannot delete backend with type ${type}`)
      }
    }

    return promise
      .then(ct => {
        if (ct === 0) {
          // FIXME: nothing was deleted? Raise an error?
        }

        dispatchReadyState(SUCCESS);
      })
      .catch(error => {
        if (RETHROW_ERRORS) {
          throw error;
        }

        dispatchReadyState(FAILURE, { error })
      })
  }
}

module.exports = {
  listAvailableBackends,
  getBackendWithDataset,
  addBackend,
  updateLocalBackendDataset,
  deleteBackend,
}
