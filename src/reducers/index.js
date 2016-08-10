"use strict";

const { combineReducers, createReducer } = require('redux-immutablejs')

module.exports = combineReducers({
  backends: require('./backends'),
  user: require('./user'),
})
