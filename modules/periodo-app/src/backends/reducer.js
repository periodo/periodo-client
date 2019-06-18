"use strict";

const R = require('ramda')
    , BackendAction = require('./actions')

const initialState = () => ({
  available: {},
  datasets: {},
  patches: {}
})

const updateBackend = (backend, datasetProxy, state) => {
  const identifier = backend.asIdentifier()

  return R.pipe(
    R.set(R.lensPath(['available', identifier]), backend),
    R.set(R.lensPath(['datasets', identifier]), datasetProxy),
  )(state)
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
        const { backend, datasetProxy } = resp

        return updateBackend(backend, datasetProxy, state)
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
        const { backend, datasetProxy } = resp

        return updateBackend(backend, datasetProxy, state)
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
