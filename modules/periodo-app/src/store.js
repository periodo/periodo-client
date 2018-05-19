"use strict";

const { createStore, applyMiddleware, compose, combineReducers } = require('redux')
    , thunk = require('redux-thunk').default
    , unionTypeMiddleware = require('./typed-actions/middleware')
    , periodoDB = require('./db')

module.exports = function () {
  return createStore(
    combineReducers({
      backends: require('./backends/reducer'),
      auth: require('./auth/reducer'),
      linkedData: require('./linked-data/reducer'),
    }),
    compose(
      applyMiddleware(thunk.withExtraArgument({ db: periodoDB() }), unionTypeMiddleware),
      window.devToolsExtension ? window.devToolsExtension() : a => a
    )
  )
}
