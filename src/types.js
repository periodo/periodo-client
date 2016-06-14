"use strict";


exports.actions = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',

  REQUEST_AVAILABLE_BACKENDS: 'REQUEST_AVAILABLE_BACKENDS',
  REQUEST_ADD_BACKEND: 'REQUEST_ADD_BACKEND',
  REQUEST_UPDATE_BACKEND: 'REQUEST_UPDATE_BACKEND',
  REQUEST_DELETE_BACKEND: 'REQUEST_DELETE_BACKEND',
  REQUEST_GET_BACKEND: 'REQUEST_GET_BACKEND',

  SET_CURRENT_BACKEND: 'SET_CURRENT_BACKEND',
  UNSET_CURRENT_BACKEND: 'UNSET_CURRENT_BACKEND',
};


exports.backends = {
  WEB: 'WEB',
  FILE: 'FILE',
  MEMORY: 'MEMORY',
  INDEXED_DB: 'INDEXED_DB',

  CANONICAL: 'CANONICAL',
}


exports.patchTypes = {
  SYNC: 'SYNC',
  MULTIPLE: 'MULTIPLE',
  CREATE_PERIOD_COLLECTION: 'CREATE_PERIOD_COLLECTION',
  DELETE_PERIOD_COLLECTION: 'DELETE_PERIOD_COLLECTION',
  EDIT_PERIOD_COLLECTION: 'EDIT_PERIOD_COLLECTION',
  CREATE_PERIOD: 'CREATE_PERIOD',
  DELETE_PERIOD: 'DELETE_PERIOD',
  EDIT_PERIOD: 'EDIT_PERIOD',
}


exports.readyStates = {
  UNSENT: 'UNSENT',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
}



// Dumb sanity check: Make sure that all keys are identical to their values.
Object.keys(exports).forEach(key => {
  Object.keys(exports[key]).forEach(type => {
    if (type !== exports[key][type]) {
      throw new Error(`The key "${type}" does not match its value ("${exports[key][type]}").`);
    }
  })

  Object.freeze(exports[key]);
});

Object.freeze(exports);
