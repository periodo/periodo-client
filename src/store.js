"use strict";

const thunk = require('redux-thunk').default
    , { createStore, applyMiddleware, compose } = require('redux')
    , unionTypeMiddleware = require('./typed-actions/middleware')


function initStore() {
  const store = createStore(
    rootReducer,
    compose(
      applyMiddleware(unionTypeMiddleware, thunk.withExtraArgument(exposedStorage)),
      (global.window || {}).devToolsExtension ? window.devToolsExtension() : a => a
    ))

  return store;
}

// FIXME: make single export
module.exports = {
  initStore,
}
