"use strict";


exports.actions = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',

  GET_ALL_BACKENDS: 'GET_ALL_BACKENDS',

  GET_BACKEND: 'GET_BACKEND',
  CREATE_BACKEND: 'CREATE_BACKEND',
  UPDATE_BACKEND: 'UPDATE_BACKEND',
  DELETE_BACKEND: 'DELETE_BACKEND',

  GENERATE_DATASET_PATCH: 'GENERATE_DATASET_PATCH',

  SET_CURRENT_BACKEND: 'SET_CURRENT_BACKEND',
  UNSET_CURRENT_BACKEND: 'UNSET_CURRENT_BACKEND',
};


exports.backends = {
  WEB: 'WEB',
  WEB_ANONYMOUS: 'WEB_ANONYMOUS',
  FILE: 'FILE',
  MEMORY: 'MEMORY',
  INDEXED_DB: 'INDEXED_DB',

  CANONICAL: 'CANONICAL',
}


exports.patchTypes = {
  SYNC: 'SYNC',
  MULTIPLE: 'MULTIPLE',

  ADD_PERIOD_COLLECTION: 'ADD_PERIOD_COLLECTION',
  REMOVE_PERIOD_COLLECTION: 'REMOVE_PERIOD_COLLECTION',
  CHANGE_PERIOD_COLLECTION: 'CHANGE_PERIOD_COLLECTION',

  ADD_PERIOD: 'ADD_PERIOD',
  REMOVE_PERIOD: 'REMOVE_PERIOD',
  CHANGE_PERIOD: 'CHANGE_PERIOD',
}


exports.patchDirections = {
  PUSH: 'PUSH',
  PULL: 'PULL',
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
