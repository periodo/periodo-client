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


function listAvailableBackends(orderBy='modified') {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_AVAILABLE_BACKENDS
    )

    dispatchReadyState(PENDING);

    return db.backends
      .orderBy(orderBy)
      .toArray()
      .then(backends => {
        backends = Immutable.List(
          backends.map(backend =>
            new Backend(backend).update('opts', Immutable.fromJS)
          )
        );

        dispatchReadyState(SUCCESS, { backends });

        return backends;
      })
      .catch(error => {
        dispatchReadyState(FAILURE, { error });
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


function getBackendWithDataset({ name, type }) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_GET_BACKEND
    )

    dispatchReadyState(PENDING)

    return db.backends
      .where('[name+type]')
      .equals([name, type])
      .toArray()
      .then(([backend]) => {
        if (!backend) {
          // FIXME: dispatch error
        }

        const responseData = {
          backend: new Backend(backend),
          dataset: Immutable.fromJS(backend.dataset)
        }

        dispatchReadyState(SUCCESS, { responseData });

        return { responseData };
      });
  }
}


// backend should be a Backend record
function addBackend({ name, type, opts=Immutable.Map() }, dataset) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_ADD_BACKEND
    )

    return Promise.resolve().then(() => {
      if (Object.keys(backendTypes).indexOf(type) === -1) {
        throw new Error('Invalid backend type')
      }

      const now = new Date().getTime()

      const backend = new Backend({ name, type, opts })
        .set('created', now)
        .set('modified', now)
        .set('accessed', now)

      if (backend.type === backendTypes.INDEXED_DB) {
        dataset = {
          periodCollections: {},
          type: 'rdf:Bag'
        }
      }

      const payload = Immutable.fromJS({ backend, dataset })

      dispatchReadyState(PENDING, { payload });

      return db.backends
        .add(Object.assign(backend.toJS(), { dataset }))
        .then(
          () => {
            dispatchReadyState(SUCCESS, { payload });
          },
          error => {
            dispatchReadyState(FAILURE, { payload, error });
          }
        )
    })
  } }

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

        return db.transaction('rw', db.backends, db.backendDatasetPatches, () => {
          return dispatch(getBackendWithDataset({ name, type }))
            .then(({ responseData }) => {
              const now = new Date().getTime()
                  , oldDataset = responseData.dataset.toJS()
                  , newDataset = dataset.toJS()
                  , patchData = patchUtils.formatPatch(oldDataset, newDataset, message)

              db.backends
                .where('[name+type]')
                .equals([name, type])
                .modify({
                  dataset: newDataset,
                  modified: now
                })

              db.backendDatasetPatches.add(Object.assign({ backendName: name }, patchData));

              return {
                payload,
                responseData: {
                  backend: responseData.backend.set('modified', now),
                  dataset,
                  patchData
                }
              }
            })
        }).then(
          resp => {
            dispatchReadyState(SUCCESS, resp);
          },
          error => {
            dispatchReadyState(FAILURE, { error })
          }
        )
      })
  }
}


function deleteBackend({ name, type }) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_DELETE_BACKEND
    )

    dispatchReadyState(PENDING);

    return db.backends
      .where('[name+type]')
      .equals([name, type])
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
