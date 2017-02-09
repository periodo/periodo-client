"use strict";

const Immutable = require('immutable')
    , { createReducer, combineReducers } = require('redux-immutablejs')
    , { RequestedResource } = require('../records')

const actionTypes = require('../types').actions

const {
  UNSENT,
  SUCCESS,
} = require('../types').readyStates


const available = createReducer(new RequestedResource(), {
  [actionTypes.REQUEST_AVAILABLE_BACKENDS]
  (state, action) {
    return Immutable.fromJS(action).delete('type');
  }
})

const current = createReducer(null, {
  [actionTypes.SET_CURRENT_BACKEND]
  (state, { backend, dataset }) {
    return Immutable.Map({ backend, dataset })
  },
});

module.exports = combineReducers({
  available,
  current
});
