"use strict";

const { createStore, applyMiddleware, compose } = require('redux')
    , thunk = require('redux-thunk').default
    , unionTypeMiddleware = require('./typed-actions/middleware')
    , periodoDB = require('./db')
    , { getApplicationReducer } = require('./modules')

module.exports = function () {
  return createStore(
    getApplicationReducer(),
    compose(
      applyMiddleware(thunk.withExtraArgument({ db: periodoDB() }), unionTypeMiddleware),
      window.devToolsExtension ? window.devToolsExtension() : a => a
    )
  )
}
