"use strict";

const R = require('ramda')
    , PatchAction = require('./actions')

const initialState = () => ({
  patches: {},
})

module.exports = function patches(state=initialState(), action) {
  if (!PatchAction.prototype.isPrototypeOf(action.type)) return state

  return action.readyState.case({
    Success: resp => action.type.case({
      GetLocalPatch(patchURL) {
        return R.set(
          R.lensPath(['patches', patchURL]),
          Object.assign(...resp._keys.map(k => ({ [k]: resp[k] }))),
          state
        )
      },

      GetOpenServerPatches() {
        return state
      },

      GenerateDatasetPatch() {
        return state
      },

      SubmitPatch() {
        return state
      },

      AddPatchComment() {
        return state
      },

      DecidePatchFate() {
        return state
      }
    }),
    _: () => state
  })
}
