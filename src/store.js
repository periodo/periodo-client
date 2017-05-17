"use strict";

const thunk = require('redux-thunk').default
    , { createStore, applyMiddleware, compose } = require('redux')
    , { isUnionTypeRecord } = require('./common/types')

const unionTypeMiddleware = store => next => action => {
  if (action.constructor === Object) {
    if (!isUnionTypeRecord(action)) {
      throw new Error('Actions should be called by creating a union type record.')
    }

    // FIXME: require doing the makeActionType thing everywhere
    const nextAction = {
      [Symbol.for('Type')]: action.type,
      type: action.type._name,
      requestID: action.requestID,
      readyState: action.readyState
    }

    return next(nextAction);
  }
}

function initStore() {
  const store = createStore(
    rootReducer,
    compose(
      applyMiddleware(unionTypeMiddleware, thunk.withExtraArgument(exposedStorage)),
      (global.window || {}).devToolsExtension ? window.devToolsExtension() : a => a
    ))

  return store;
}

module.exports = {
  unionTypeMiddleware,
  initStore,
}
