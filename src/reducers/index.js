"use strict";

const { combineReducers } = require('redux-immutablejs')

module.exports = combineReducers({
  backends: require('./backends'),
  user: require('./user')
})
