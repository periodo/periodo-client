"use strict";

const R = require('ramda')
    , LinkedDataAction = require('./actions')

const initialState = () => ({
  nameByORCID: {},
  sources: {},
})

module.exports = function linkedData(state=initialState(), action) {
  if(!Object.prototype.isPrototypeOf.call(LinkedDataAction.prototype, action.type)) {
    return state
  }

  return action.readyState.case({
    Success: resp => action.type.case({
      FetchLinkedData() {
        return state
      },

      FetchSource() {
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
      },
    }),
    _: () => state,
  })
}
