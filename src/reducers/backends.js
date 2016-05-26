"use strict";

const Immutable = require('immutable')
    , { createReducer, combineReducers } = require('redux-immutablejs')

const {
  SET_AVAILABLE_BACKENDS,

  ADD_LOADED_BACKEND,
  REMOVE_LOADED_BACKEND,

  SET_CURRENT_BACKEND,
  UNSET_CURRENT_BACKEND,
} = require('../actions')


const available = createReducer(Immutable.Set(), {
  [SET_AVAILABLE_BACKENDS]: (state, { backends }) => (
    backends
  )
})


const loaded = createReducer(Immutable.Map(), {
  [ADD_LOADED_BACKEND]: (state, { backend }) => (
    state.set(Immutable.List([backend.type, backend.name]), backend)
  ),

  [REMOVE_LOADED_BACKEND]: (state, { backend }) => (
    state.delete(Immutable.List([backend.type, backend.name]))
  )
});

const current = createReducer(null, {
  [SET_CURRENT_BACKEND]: (state, { backend }) => (
    backend
  ),

  [UNSET_CURRENT_BACKEND]: () => (
    null
  )
});

module.exports = combineReducers({
  available,
  loaded,
  current
});
