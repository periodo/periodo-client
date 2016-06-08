"use strict";

const Immutable = require('immutable')
    , { createReducer, combineReducers } = require('redux-immutablejs')

const actionTypes = require('../types/actions')

const available = createReducer(Immutable.Set(), {
  [actionTypes.SET_AVAILABLE_BACKENDS]
  (state, { backends }) {
    return backends
  }
})

const current = createReducer(null, {
  [actionTypes.REQUEST_CHANGE_BACKEND]
  (state, { backend }) {
    return backend
  },

  [actionTypes.SET_CURRENT_BACKEND]
  (state, { backend }) {
    return backend
  },

  [actionTypes.UNSET_CURRENT_BACKEND]
  () {
    return null
  }
});

module.exports = combineReducers({
  available,
  current
});
