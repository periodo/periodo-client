"use strict";

const R = require('ramda')
    , { $$Authority } = require('periodo-utils/src/symbols')
    , BackendAction = require('./actions')

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
    R.lensProp('authorities'),
    R.map(authority =>
      R.over(
        R.lensProp('periods'),
        R.map(R.assoc($$Authority, authority)),
        authority
      )
    ),
    dataset
  )
}

module.exports = function backends(state=initialState(), action) {
  if (!BackendAction.prototype.isPrototypeOf(action.type)) return state;

  return action.readyState.case({
    Success: resp => action.type.case({
      CreateBackend() {
        return state;
      },

      GetAllBackends() {
        const { backends } = resp

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
        const { backend, dataset } = resp

        return updateBackend(backend, dataset, state)
      },

      GetBackendHistory(storage) {
        const { patches } = resp

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
        const { backend } = resp

        return R.set(R.lensPath(['available', backend.asIdentifier()]), backend, state)
      },

      UpdateLocalDataset() {
        const { backend, dataset } = resp

        return updateBackend(backend, dataset, state)
      },

      DeleteBackend(storage) {
        const removeBackend = R.omit([storage.asIdentifier()])

        return R.pipe(
          R.over(R.lensProp('datasets'), removeBackend),
          R.over(R.lensProp('available'), removeBackend)
        )(state)
      },

      DeleteAllBackends() {
        return R.pipe(
          R.set(R.lensProp('datasets'), {}),
          R.set(R.lensProp('available'), {})
        )(state)
      }
    }),
    _: () => state
  })
}
