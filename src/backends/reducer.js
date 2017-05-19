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
    Failure: () => state,
    Success: () => moduleActionCase(action, {
      GetAllBackends() {
        return R.set(
          R.lensProp('available'),
          getResponse(action).backends,
          state
        )
      },

      GetBackend() {
        const { metadata, dataset, /*setAsActive*/ } = getResponse(action)

        return R.set(
          R.lensProp('current'),
          { metadata, dataset },
          state
        )
      }
    })
  })
}
