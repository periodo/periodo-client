"use strict";

const R = require('ramda')
    , { isInModule
      , getResponse
      , moduleActionCase
      , readyStateCase
      } = require('../typed-actions/utils')

const initialState = () => ({
  available: {},
  datasets: {},
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
        const { backends } = getResponse(action)

        const backendObj = R.fromPairs(backends.map(backend => [
          backend.asIdentifier(),
          backend,
        ]))

        return R.set(R.lensProp('available'), backendObj, state)
      },

      GetBackendDataset() {
        const { backend, dataset } = getResponse(action)
            , identifier = backend.asIdentifier()

        return R.pipe(
          R.set(R.lensPath(['available', identifier]), backend),
          R.set(R.lensPath(['datasets', identifier]), dataset),
        )(state)
      }
    })
  })
}
