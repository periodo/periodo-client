"use strict";

const R = require('ramda')
    , { isInModule
      , getResponse
      , getActionType
      , moduleActionCase
      , readyStateCase
      } = require('../typed-actions/utils')

const initialState = () => ({
  available: {},
  datasets: {},
})

const updateBackend = (backend, dataset, state) => {
  const identifier = backend.asIdentifier()

  return R.pipe(
    R.set(R.lensPath(['available', identifier]), backend),
    R.set(R.lensPath(['datasets', identifier]), dataset)
  )(state)
}

module.exports = function backends(state=initialState(), action) {
  if (!isInModule(action, 'backend')) return state;

  return readyStateCase(action, {
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

        return updateBackend(backend, dataset, state)
      },

      UpdateBackend() {
        const { backend } = getResponse(action)

        return R.set(R.lensPath(['available', backend.asIdentifier()]), backend, state)
      },

      UpdateLocalDataset() {
        const { backend, dataset } = getResponse(action)

        return updateBackend(backend, dataset, state)
      },

      DeleteBackend() {
        const { storage } = getActionType(action)
            , removeBackend = R.omit([storage.identifier()])

        return R.pipe(
          R.over(R.lensProp('datasets'), removeBackend),
          R.over(R.lensProp('available'), removeBackend)
        )(state)
      }
    }),
    _: () => state
  })
}
