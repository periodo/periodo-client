"use strict";

const R = require('ramda')
    , { isInModule, moduleActionCase, readyStateCase } = require('../typed-actions/utils')

const initialState = () => ({
  nameByORCID: {},
  sources: {},
})

module.exports = function linkedData(state=initialState(), action) {
  if (!isInModule(action, 'linkedData')) return state;

  return readyStateCase(action, {
    Success: resp => moduleActionCase(action, {
      FetchLinkedData() {
        return state
      },

      FetchORCIDs() {
        const { nameByORCID } = resp

        return R.over(
          R.lensProp('nameByORCID'),
          R.flip(R.merge)(nameByORCID),
          state
        )
      }

    }),
    _: () => state
  })
}
