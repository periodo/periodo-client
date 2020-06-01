"use strict";

const R = require('ramda')
    , MainAction = require('./actions')

function initialState() {
  return {
    browser: {
      indexedDBSupported: null,
      isPersisted: null,
    },
  }
}

module.exports = function main(state=initialState(), action) {
  if(!Object.prototype.isPrototypeOf.call(MainAction.prototype, action.type)) {
    return state
  }

  return action.readyState.case({
    Success: resp => action.type.case({
      InitIndexedDB() {
        return R.assocPath([ 'browser', 'indexedDBSupported' ], true, state)
      },

      RequestPersistence() {
        const { isPersisted } = resp

        return R.assocPath([ 'browser', 'isPersisted' ], isPersisted, state)
      },

      CheckPersistence() {
        const { isPersisted } = resp

        return R.assocPath([ 'browser', 'isPersisted' ], isPersisted, state)
      },
    }),

    Failure: err => action.type.case({
      InitIndexedDB() {
        return R.assocPath([ 'browser', 'indexedDBSupported' ], false, state)
      },

      _: () => state,
    }),

    _: () => state,
  })
}
