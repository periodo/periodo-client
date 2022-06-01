"use strict";

const R = require('ramda')
    , AuthAction = require('./actions')

const initialState = () => ({
  settings: {},
})

module.exports = function auth(state=initialState(), action) {
  if(!Object.prototype.isPrototypeOf.call(AuthAction.prototype, action.type)) {
    return state
  }

  return action.readyState.case({
    Success: resp => action.type.case({
      GetAllSettings() {
        const { settings } = resp

        return R.mergeRight(state, { settings })
      },

      UpdateSettings() {
        const { settings } = resp

        return R.mergeRight(state, { settings })
      },

    }),
    _: () => state,
  })
}
