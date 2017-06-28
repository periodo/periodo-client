"use strict";

const R = require('ramda')
    , { isInModule
      , getResponse
      , moduleActionCase
      , readyStateCase
      } = require('../typed-actions/utils')

const initialState = () => ({
  available: null,
  current: null,
  loaded: {},
})

module.exports = function backends(state=initialState(), action) {
  if (!isInModule(action, 'backend')) return state;

  return readyStateCase(action, {
    Pending: () => state,
    Failure: err => {
      throw err;

      return state
    },
    Success: () => moduleActionCase(action, {
      CreateBackend() {
        return state;
      },

      GetAllBackends() {
        return R.set(
          R.lensProp('available'),
          getResponse(action).backends,
          state
        )
      },

      GetBackend() {
        const data = getResponse(action)
            , identifier = data.type.asIdentifier()

        // localStorage.currentBackend = Backend.serialize(type)

        return R.set(R.lensPath(['loaded', identifier]), data, state)
      }
    })
  })
}
