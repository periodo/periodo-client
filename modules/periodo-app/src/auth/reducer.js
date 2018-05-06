"use strict";

const R = require('ramda')
    , { isInModule, moduleActionCase, readyStateCase } = require('../typed-actions/utils')

const initialState = () => ({
  settings: {},
})

module.exports = function auth(state=initialState(), action) {
  if (!isInModule(action, 'auth')) return state;

  return readyStateCase(action, {
    Success: resp => moduleActionCase(action, {
      GetAllSettings() {
        const { settings } = resp

        return R.merge(state, { settings })
      },

      UpdateSettings() {
        const { settings } = resp

        return R.merge(state, { settings })
      }

    }),
    _: () => state
  })
}
