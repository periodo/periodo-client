const Immutable = require('immutable')
    , patchUtils = require('../utils/patch')
    , { Backend } = require('../records')
    , { bindRequestAction } = require('./requests')


const {
  REQUEST_AVAILABLE_BACKENDS,

  REQUEST_ADD_BACKEND,
  REQUEST_DELETE_BACKEND,
  REQUEST_GET_BACKEND,
  REQUEST_UPDATE_BACKEND,

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
    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_AVAILABLE_BACKENDS
    )

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


function setCurrentBackend({ name, type }) {
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


function getBackendWithDataset({ name, url, type }) {
  return (dispatch, getState, { db }) => {
    let promise

    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_GET_BACKEND
    )

    dispatchReadyState(PENDING)

    if (type === backendTypes.INDEXED_DB) {
      promise = db.localBackends
        .where('name')
        .equals(name)
        .toArray()
        .then(([backend]) => {
          if (!backend) {
            throw Error(`No existing local backend named ${name}`)
          }

          return backend
        })
    } else if (type === backendTypes.WEB) {
      const backend = { type, url }

      promise = fetch(backend.url)
        .then(resp => {
          if (!resp.ok) {
            throw new Error(
            `Failed to fetch backend at ${url}.` +
            '\n' +
            `${resp.status} ${resp.statusText}`)
          }

          backend.modified = resp.headers.get('Last-Modified');

          return resp.json()
        })
        .then(dataset => {
          backend.dataset = dataset;

          return backend;
        })
    } else {
      throw Error(`No way to fetch backend with type ${type}.`)
    }

    return promise
      .then(backend => {
        const responseData = {
          backend: new Backend(backend),
          dataset: Immutable.fromJS(backend.dataset)
        }

        dispatchReadyState(SUCCESS, { responseData });

        return { responseData };
      })
      .catch(error => {
        dispatchReadyState(FAILURE, { error });
        throw error;
      })
  }
}


// backend should be a Backend record
function addBackend({ name, type, opts=Immutable.Map() }, dataset) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_ADD_BACKEND
    )

    let payload;

    return Promise.resolve().then(() => {
      if (Object.keys(backendTypes).indexOf(type) === -1) {
        throw new Error('Invalid backend type')
      }

      const now = new Date().getTime()

      let backend = new Backend({ name, type, opts })
        .set('created', now)
        .set('modified', now)
        .set('accessed', now)

      if (backend.type === backendTypes.INDEXED_DB) {
        dataset = {
          periodCollections: {},
          type: 'rdf:Bag'
        }
      }

      backend = backend.toMap().delete('id');

      payload = Immutable.fromJS({ backend, dataset })

      dispatchReadyState(PENDING, { payload });

      return db.localBackends
        .add(Object.assign(backend.toJS(), { dataset }))
    }).then(() => {
      dispatchReadyState(SUCCESS, { payload });
    }, error => {
      dispatchReadyState(FAILURE, { payload, error })
    })
  }
}

function updateBackendDataset({ name, type }, dataset, message) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_UPDATE_BACKEND
    )

    return Promise.resolve()
      .then(() => {
        const payload = { dataset }

        if (type !== backendTypes.INDEXED_DB) {
          throw new Error('Can only update indexedDB backends')
        }

        dispatchReadyState(PENDING, { payload });

        return db.transaction('rw', db.localBackends, db.localBackendPatches, () => {
          return dispatch(getBackendWithDataset({ name, type }))
            .then(({ responseData }) => {
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
      }).then(resp => {
        dispatchReadyState(SUCCESS, resp)
      })
      .catch(error => { dispatchReadyState(FAILURE, { error }) })
  }
}


function deleteBackend({ name, type }) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_DELETE_BACKEND
    )

    // fixme
    type

    dispatchReadyState(PENDING);

    return db.localBackends
      .where('name')
      .equals(name)
      .delete()
      .then(ct => {
        if (ct === 0) {
          // FIXME: nothing was deleted? Raise an error?
        }

        dispatchReadyState(SUCCESS);
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
