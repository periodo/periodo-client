"use strict";

const R = require('ramda')
    , LinkedDataAction = require('./actions')

const initialState = () => ({
  infoByORCID: {},
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
        const { infoByORCID } = resp

        return R.over(
          R.lensProp('infoByORCID'),
          R.flip(R.mergeRight)(infoByORCID),
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
