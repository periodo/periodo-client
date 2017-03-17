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
  [actionTypes.GET_BACKEND]
  (state, action) {
    const resp = Immutable.fromJS(action).delete('type')

    return resp.get('setAsActive') ? resp : state
  },
});

module.exports = combineReducers({
  available,
  current
});
