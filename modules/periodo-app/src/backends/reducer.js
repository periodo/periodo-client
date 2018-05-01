"use strict";

const R = require('ramda')
    , { $$Authority } = require('periodo-utils/src/symbols')
    , { isInModule
      , getResponse
      , getActionType
      , moduleActionCase
      , readyStateCase
      } = require('../typed-actions/utils')

const initialState = () => ({
  available: {},
  datasets: {},
  patches: {}
})

const updateBackend = (backend, dataset, state) => {
  const identifier = backend.asIdentifier()

  return R.pipe(
    R.set(R.lensPath(['available', identifier]), backend),
    R.set(R.lensPath(['datasets', identifier]), addAuthoritySymbols(dataset))
  )(state)
}

function addAuthoritySymbols(dataset) {
  return R.over(
    R.lensProp('periodCollections'),
    R.map(authority =>
      R.over(
        R.lensProp('definitions'),
        R.map(R.assoc($$Authority, authority)),
        authority
      )
    ),
    dataset
  )
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

        const availableBackends = R.fromPairs(backends.map(backend => [
          backend.asIdentifier(),
          backend,
        ]))

        // Don't just set `available`, since anonymous Web backends might be
        // contained in there. Instead, just merge.
        return R.over(
          R.lensProp('available'),
          R.flip(R.merge)(availableBackends),
          state
        )
      },

      GetBackendDataset() {
        const { backend, dataset } = getResponse(action)

        return updateBackend(backend, dataset, state)
      },

      GetBackendHistory() {
        const { $$ActionType }  = require('../typed-actions/symbols')
            , { storage } = action[$$ActionType]
            , { patches } = getResponse(action)

        return R.set(
          R.lensPath(['patches', storage.asIdentifier()]),
          patches,
          state
        )
      },

      GetBackendPatch() {
        return state
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
            , removeBackend = R.omit([storage.asIdentifier()])

        return R.pipe(
          R.over(R.lensProp('datasets'), removeBackend),
          R.over(R.lensProp('available'), removeBackend)
        )(state)
      }
    }),
    _: () => state
  })
}
