"use strict";

const R = require('ramda')
    , LinkedDataAction = require('./actions')

const initialState = () => ({
  nameByORCID: {},
  sources: {},
})

module.exports = function linkedData(state=initialState(), action) {
  if (!LinkedDataAction.prototype.isPrototypeOf(action.type)) return state

  return action.readyState.case({
    Success: resp => action.type.case({
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
      },

      ClearLinkedDataCache() {
        return {}
      }
    }),
    _: () => state
  })
}
