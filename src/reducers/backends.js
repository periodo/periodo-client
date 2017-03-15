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
  [actionTypes.GET_ALL_BACKENDS]
  (state, action) {
    const resp = Immutable.fromJS(action).delete('type')

    return state.merge(resp)
  }
})

const current = createReducer(null, {
  [actionTypes.SET_CURRENT_BACKEND]
  (state, { backend, dataset }) {
    return Immutable.fromJS({ backend, dataset })
  },
});

module.exports = combineReducers({
  available,
  current
});
