"use strict";

const R = require('ramda')

const initialState = () => ({
  available: null,
  current: null,
  loaded: {},
})

module.exports = function backends(state=initialState(), action) {
  const T = action[Symbol.for('Type')]

  if (!T || T.module !== 'backend') return state;

  const isSuccess = action.readyState.case({
    Success: () => true,
    _: () => false
  })

  if (!isSuccess) return state;

  return T.case({
    GetAllBackends() {
      return R.set(
        R.lensProp('available'),
        action.readyState.response.backends,
        state
      )
    },

    GetBackend() {
      const { metadata, dataset, /*setAsActive*/ } = action.readyState.response

      return R.set(
        R.lensProp('current'),
        { metadata, dataset },
        state
      )
    }
  })
}
