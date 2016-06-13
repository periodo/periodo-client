const Immutable = require('immutable')
    , { Backend } = require('../records')
    , { bindRequestAction } = require('./requests')


const {
  REQUEST_AVAILABLE_BACKENDS,

  REQUEST_ADD_BACKEND,
  REQUEST_DELETE_BACKEND,
  REQUEST_GET_BACKEND,

  SET_CURRENT_BACKEND,
} = require('../types').actions

const {
  INDEXED_DB,
} = require('../types').backends

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


function setCurrentBackend(name, type) {
  return dispatch => {
    dispatch(getBackendWithDataset(name, type))
      .then(backend => {
        dispatch({
          type: SET_CURRENT_BACKEND,
          backend
        })
      });
  }
}


function getBackendWithDataset(name, type) {
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

        const dataset = Immutable.fromJS(backend.dataset);

        dispatch(SUCCESS, {
          backend: new Backend(backend),
          dataset
        })

        return backend;
      });
  }
}


// backend should be a Backend record
function addBackend(backend, dataset) {
  return (dispatch, getState, { db }) => {
    const dispatchReadyState = bindRequestAction(
      dispatch,
      REQUEST_ADD_BACKEND
    )

    const now = new Date().getTime()

    backend = new Backend(backend)
      .set('created', now)
      .set('modified', now)
      .set('accessed', now)

    if (backend.type === INDEXED_DB) {
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
          dispatchReadyState(FAILURE, { payload, error })
        }
      )
  }
}

function updateBackendDataset(backend, dataset) {
  return (dispatch, getState, { db }) => {
    const transactionTables = [db.backends]

    if (backend.type === INDEXED_DB) {
      transactionTables.push(db.idbBackendPatches);
    }

    return db.transaction('rw', ...transactionTables, () => {
      if (backend.type === INDEXED_DB) {
        // const patchData = patchUtils.formatPatch(oldData.data, newData, message)
      }

      return db.backends
        .where('[name+type]')
        .equals([backend.name, backend.type])
        .modify({
          dataset: dataset.toJS(),
          modified: new Date().getTime()
        })
        .then(ct => {
          if (ct === 0) {
            // FIXME: nothing was saved? Raise an error?
          }
        })
    });
  }
}


function deleteBackend(name, type) {
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
