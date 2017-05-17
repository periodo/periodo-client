"use strict";

const R = require('ramda')

const initialState = () => ({
  available: null,
  current: null,
  loaded: {},
})

module.exports = function backends(state=initialState(), action) {
  if (action.module !== 'backends') return state;

  const isSuccess = action.readyState.case({
    Success: () => true,
    _: () => false
  })

  if (!isSuccess) return state;

  return action.case({
    GetAllBackends() {
      return R.set(
        R.lensProp('available'),
        action.response.backends,
        state
      )
    },

    GetBackend() {
      const { metadata, dataset, /*setAsActive*/ } = action.response

      return R.set(
        R.lensProp('current'),
        { metadata, dataset },
        state
      )
    }
  })
}
