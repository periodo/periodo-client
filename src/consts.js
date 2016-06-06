"use strict";

function define(label, consts) {
  const ns = exports[label] = {};

  consts.forEach(name => {
    ns[name] = name;
  })

  Object.freeze(ns);
}


define('actions', [
  'USER_LOGIN',
  'USER_LOGOUT',

  'SET_AVAILABLE_BACKENDS',
  'ADD_LOADED_BACKEND',
  'REMOVE_LOADED_BACKEND',

  'SET_CURRENT_BACKEND',
  'UNSET_CURRENT_BACKEND',
]);


define('patchTypes', [
  'SYNC',
  'MULTIPLE',
  'CREATE_PERIOD_COLLECTION',
  'DELETE_PERIOD_COLLECTION',
  'EDIT_PERIOD_COLLECTION',
  'CREATE_PERIOD',
  'DELETE_PERIOD',
  'EDIT_PERIOD',
]);


Object.freeze(exports);
