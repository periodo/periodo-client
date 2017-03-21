"use strict";

const { createStore, applyMiddleware, compose } = require('redux')
    , rootReducer = require('../rootReducer')
    , thunk = require('redux-thunk').default
    , periodoDB = require('../db')

module.exports = function () {
  createStore(
    rootReducer,
    compose(
      applyMiddleware(thunk.withExtraArgument({ db: periodoDB() })),
      window.devToolsExtension ? window.devToolsExtension() : a => a
    )
  )
}
