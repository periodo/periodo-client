const Immutable = require('immutable')
    , patchUtils = require('../utils/patch')
    , parseURL = require('url').parse
    , { Backend } = require('../records')
    , { bindRequestAction } = require('./requests')


const {
  GET_ALL_BACKENDS,

  GET_BACKEND,
  CREATE_BACKEND,
  UPDATE_BACKEND,
  DELETE_BACKEND,

  SET_CURRENT_BACKEND,
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
      db.localBackends.toArray(localBackends => {
        db.remoteBackends.toArray(remoteBackends => {
          const backends = Immutable.List()
            .concat(localBackends.map(makeBackend(backendTypes.INDEXED_DB)))
            .concat(remoteBackends.map(makeBackend(backendTypes.WEB)))

          dispatchReadyState(SUCCESS, { responseData: { backends }});

          return backends;
        })
      })
      .catch(error => {
        dispatchReadyState(FAILURE, { error });
      })
    })
  }
}


function setCurrentBackend({ label, type }) {
  return dispatch => {
    dispatch(getBackendWithDataset({ name, type }))
      .then(backend => {
        dispatch({
          type: SET_CURRENT_BACKEND,
          backend
        })
      });
  }
}

function setFileBackend({ file }) {
  const parsePeriodoUpload = require('../utils/parse_periodo_upload')

  return dispatch => {
    const backend = new Backend({
      type: FILE,
      name: file.name,
      // ...the rest of the metadata
    })

    parsePeriodoUpload(file).then(
      dataset => dispatch({
        type: SET_CURRENT_BACKEND,
        backend,
        dataset
      })
    )

  }
}


function getBackendWithDataset({ name, url, type }, setAsActive=false) {
  return (dispatch, getState, { db }) => {
    let promise

    const dispatchReadyState = bindRequestAction(dispatch, GET_BACKEND)

    dispatchReadyState(PENDING)

    switch (type) {
      case backendTypes.INDEXED_DB:
        promise = db.localBackends
          .where('name')
          .equals(name)
          .toArray()
          .then(([backend]) => {
            if (!backend) {
              throw Error(`No existing local backend named ${name}`)
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
        backend: new Backend(backend),
        dataset: Immutable.fromJS(dataset)
      }



      dispatchReadyState(SUCCESS, { responseData });

      if (setAsActive) {
        dispatch({ SET_CURRENT_BACKEND, backend })
      }

      return responseData;
    })
    .catch(error => {
      dispatchReadyState(FAILURE, { error });
      throw error;
    })
  }
}


// backend should be a Backend record
function addBackend({ label, description, type, url=null }, dataset=null) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(dispatch, CREATE_BACKEND)

    let payload;

    return Promise.resolve()
      .then(() => {
        if (Object.keys(backendTypes).indexOf(type) === -1) {
          throw new Error('Invalid backend type');
        }

        if (type === backendTypes.WEB) {
          if (!url) {
            throw new Error('Cannot add a Web backend without a URL.');
          }

          const { protocol, host } = parseURL(url)

          if (!(protocol && host)) {
            throw new Error(`Invalid URL: ${url}`);
          }
        }

        const now = new Date().getTime()

        let backend = new Backend({ label, description, type, url })
          .set('created', now)
          .set('modified', now)
          .set('accessed', now)

        backend = backend.toMap().delete('id');

        if (backend.get('type') === backendTypes.INDEXED_DB) {
          dataset = {
            periodCollections: {},
            type: 'rdf:Bag'
          }

          backend = backend.delete('url')
        }

        const table = backend.type === backendTypes.WEB
          ? db.remoteBackends
          : db.localBackends

        backend = backend.delete('type')

        payload = Immutable.fromJS({ backend, dataset })

        dispatchReadyState(PENDING, { payload });

        return table.add(Object.assign(backend.toJS(), { dataset }))
      })
      .then(() => {
        dispatchReadyState(SUCCESS, { payload });
      })
      .catch(error => {
        dispatchReadyState(FAILURE, { payload, error })
      })
  }
}

function updateBackendDataset({ name, type }, dataset, message) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(dispatch, UPDATE_BACKEND)

    return Promise.resolve()
      .then(() => {
        const payload = { dataset }

        if (type !== backendTypes.INDEXED_DB) {
          throw new Error('Can only update indexedDB backends')
        }

        dispatchReadyState(PENDING, { payload });

        return db.transaction('rw', db.localBackends, db.localBackendPatches, () => {
          return dispatch(getBackendWithDataset({ name, type }))
            .then(responseData => {
              const now = new Date().getTime()
                  , oldDataset = responseData.dataset.toJS()
                  , newDataset = dataset.toJS()
                  , patchData = patchUtils.formatPatch(oldDataset, newDataset, message)

              const backend = db.localBackends.where('name').equals(name)

              backend.modify({
                dataset: newDataset,
                modified: now
              })

              backend.first().then(({ id }) => {
                db.localBackendPatches.add(Object.assign({ backendID: id }, patchData));
              })

              return {
                payload,
                responseData: {
                  backend: responseData.backend.set('modified', now),
                  dataset,
                  patchData
                }
              }
            })
        })
      })
      .then(resp => {
        dispatchReadyState(SUCCESS, resp)
      })
      .catch(error => {
        dispatchReadyState(FAILURE, { error })
      })
  }
}


function deleteBackend({ name, url, type }) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(dispatch, DELETE_BACKEND)

    dispatchReadyState(PENDING);

    let promise

    if (type === backendTypes.INDEXED_DB) {
      promise = db.localBackends
        .where('name')
        .equals(name)
        .delete()
    } else if (type === backendTypes.WEB) {
      promise = db.remoteBackends
        .where('url')
        .equals(url)
        .delete()
    } else {
      promise = Promise.resolve().then(() => {
        throw new Error(`Cannot delete backend with type ${type}`)
      })
    }

    return promise
      .then(ct => {
        if (ct === 0) {
          // FIXME: nothing was deleted? Raise an error?
        }

        dispatchReadyState(SUCCESS);
      })
      .catch(error => {
        dispatchReadyState(FAILURE, { error })
      })
  }
}

module.exports = {
  listAvailableBackends,
  setCurrentBackend,
  getBackendWithDataset,
  addBackend,
  updateBackendDataset,
  deleteBackend,
}
