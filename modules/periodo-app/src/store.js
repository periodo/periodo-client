"use strict";

const { createStore, applyMiddleware, combineReducers } = require('redux')
    , { typedAsyncActionMiddleware } = require('org-async-actions')
    , periodoDB = require('./db')

module.exports = function () {
  const db = periodoDB()

  const store = createStore(
    combineReducers({
      main: require('./main/reducer'),
      backends: require('./backends/reducer'),
      auth: require('./auth/reducer'),
      linkedData: require('./linked-data/reducer'),
      patches: require('./patches/reducer'),
      graphs: require('./graphs/reducer'),
    }),
    applyMiddleware(typedAsyncActionMiddleware({ db }))
  )

  return {
    store,
    db,
  }
}
