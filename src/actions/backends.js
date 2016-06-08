const Immutable = require('immutable')
    , { Backend } = require('../records')
    , periodoDB = require('../../db')

const {
  SET_AVAILABLE_BACKENDS,
  SET_CURRENT_BACKEND
} = require('../types').actions

const {
  INDEXED_DB
} = require('../types').backends


/*
function determineIDBSupport() {
  return Object.keys(Dexie.dependencies).every(k => dependencies[k]);
}
*/

function listAvailableBackends(orderBy='modified', dexieOpts) {
  return dispatch => {
    return periodoDB(dexieOpts)
      .backends
      .orderBy(orderBy)
      .toArray()
      .then(backends => {
        backends = Immutable.List(
          backends.map(backend =>
            new Backend(backend).update('opts', Immutable.fromJS)
          )
        );

        dispatch({
          type: SET_AVAILABLE_BACKENDS,
          backends
        });

        return backends;
      })
  }
}


function setCurrentBackend(name, type) {
  return dispatch => {
    getBackend(name, type).then(backend => {
      dispatch({
        type: SET_CURRENT_BACKEND,
        backend
      })
    });
  }
}


function getBackend(name, type, dexieOpts) {
  return dispatch => {
    return periodoDB(dexieOpts)
      .where('[name+type]')
      .equals([name, type])
      .toArray()
      .then(([backend]) => {
        if (!backend) {
          // FIXME: dispatch error
        }

        const data = Immutable.fromJS(backend.data);

        dispatch({
          type: SET_CURRENT_BACKEND,
          backend,
          data
        });

        return backend;
      });
  }
}


/*
function addBackend(backend, dexieOpts) {
  return listAvailableBackends(undefined, dexieOpts)
    .then(backends => {
      const alreadyExists = backends.filter(backend =>
        backend.type == type && backend.name === name
      )

      if (alreadyExists) {
        throw new Error(`There is already a backend with name: ${name}`);
      }

      let db
        , dbOpen

      if (type === 'idb') {
        db = require('./db')(name);
        dbOpen = new Promise(resolve => db.on('ready', resolve));
      } else if (type === 'web') {
        const webDBs = JSON.parse(localStorage.WebDatabaseNames || '{}')

        webDBs[name] = opts;
        localStorage.WebDatabaseNames = JSON.stringify(webDBs);
      } else if (type === 'file') {
        // Name of DB will be different from filename itself
        dbOpen = require('./file_backends')
          .addFile(name, data)
          .then(({ name }) => ({ name }))
      } else {
        throw new Error(`Invalid backend type: ${opts.type}`);
      }

      return Promise
        .resolve(dbOpen)
        .then(() => getBackend(name));
    })
}


*/

function updateBackend(name, type, data, dexieOpts) {
  const db = periodoDB(dexieOpts)
      , transactionTables = [db.backends]

  if (type === INDEXED_DB) {
    transactionTables.push(db.idbBackendPatches);
  }

  return (dispatch, getState) => {
    return db.transaction('rw', ...transactionTables, () => {
      if (type === INDEXED_DB) {
        // const patchData = patchUtils.formatPatch(oldData.data, newData, message)
      }

      db.backends
        .where('[name+type]')
        .equals([name, type])
        .modify({
          data: data.toJS(),
          modified: new Date().getTime()
        })
        .then(ct => {
          if (ct === 0) {
            // FIXME: nothing was saved? Raise an error?
          }

          const { current } = getState().backends

          if (current.name === name && current.type === type) {
            getBackend(name, type, dexieOpts)(dispatch);
          }
        })
    });
  }
}


function deleteBackend(name, type, dexieOpts) {
  return dispatch => {
    return periodoDB(dexieOpts)
      .where('[name+type]')
      .equals([name, type])
      .delete()
      .then(ct => {
        if (ct === 0) {
          // FIXME: nothing was deleted? Raise an error?
        }

        // FIXME: dispatch something
      });
  }
}

module.exports = {
  listAvailableBackends,
  setCurrentBackend,
  getBackend,
  //addBackend,
  updateBackend,
  deleteBackend,

}
