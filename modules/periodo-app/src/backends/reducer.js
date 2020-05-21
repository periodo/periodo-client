"use strict";

const R = require('ramda')
    , BackendAction = require('./actions')

const initialState = () => ({
  available: {},
  datasets: {},
  patches: {},
})

const updateBackend = (backend, dataset, state) => {
  const identifier = backend.asIdentifier()

  return R.pipe(
    R.set(R.lensPath([ 'available', identifier ]), backend),
    R.set(
      R.lensPath([ 'datasets', identifier ]),
      dataset
    )
  )(state)
}

module.exports = function backends(state=initialState(), action) {
  if(!Object.prototype.isPrototypeOf.call(BackendAction.prototype, action.type)) {
    return state
  }

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

      GetFileStorage() {
        return state
      },

      GetBackendDataset() {
        const { backend, dataset } = resp

        return updateBackend(backend, dataset, state)
      },

      UpdateBackend() {
        return state
      },

      UpdateLocalDataset() {
        const { backend, dataset } = resp

        return updateBackend(backend, dataset, state)
      },

      AddOrcidCredential() {
        return state
      },

      RemoveOrcidCredential() {
        return state
      },

      DeleteBackend(storage) {
        const removeBackend = R.omit([ storage.asIdentifier() ])

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
      },
    }),
    _: () => state,
  })
}
