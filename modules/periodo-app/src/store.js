"use strict";

const { createStore, applyMiddleware, compose, combineReducers } = require('redux')
    , thunk = require('redux-thunk').default
    , { typedAsyncActionMiddleware } = require('org-async-actions')
    , periodoDB = require('./db')

module.exports = function () {
  return createStore(
    combineReducers({
      backends: require('./backends/reducer'),
      auth: require('./auth/reducer'),
      linkedData: require('./linked-data/reducer'),
      patches: require('./patches/reducer')
    }),
    compose(
      applyMiddleware(typedAsyncActionMiddleware({ db: periodoDB() })),
      window.devToolsExtension ? window.devToolsExtension() : a => a
    )
  )
}
