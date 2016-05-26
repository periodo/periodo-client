"use strict";

const actions = [
  'USER_LOGIN',
  'USER_LOGOUT',

  'SET_AVAILABLE_BACKENDS',
  'ADD_LOADED_BACKEND',
  'REMOVE_LOADED_BACKEND',

  'SET_CURRENT_BACKEND',
  'UNSET_CURRENT_BACKEND'
]

actions.forEach(action => {
  exports[action] = action;
});

Object.freeze(exports);
