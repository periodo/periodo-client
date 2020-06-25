"use strict";

const R = require('ramda')
    , PatchAction = require('./actions')
    , { stripUnionTypeFields } = require('periodo-common')

const initialState = () => ({
  byBackend: {
    // history: ...
    // patches: ...
    // patchRequestList: ...
    // patchRequests: ...
  },
})

module.exports = function patches(state=initialState(), action) {
  if(!Object.prototype.isPrototypeOf.call(PatchAction.prototype, action.type)) {
    return state
  }

  return action.readyState.case({
    Success: resp => action.type.case({
      GetPatchRequest(remoteBackend, patchPath) {
        const patchURL = new URL(patchPath, remoteBackend.storage.url)

        return R.set(
          R.lensPath([
            'byBackend',
            remoteBackend.asIdentifier(),
            'patchRequests',
            patchURL,
          ]),
          stripUnionTypeFields(resp),
          state
        )
      },

      GetPatchRequestList(storage) {
        return R.set(
          R.lensPath([
            'byBackend',
            storage.asIdentifier(),
            'patchRequestList',
          ]),
          resp.patchRequests,
          state
        )
      },

      GetBackendHistory(storage) {
        return R.set(
          R.lensPath([
            'byBackend',
            storage.asIdentifier(),
            'history',
          ]),
          resp.patches,
          state
        )
      },

      GetPatch(storage, patchID) {
        return R.set(
          R.lensPath([
            'byBackend',
            storage.asIdentifier(),
            'patches',
            patchID,
          ]),
          stripUnionTypeFields(resp),
          state
        )
      },

      GeneratePatch() {
        return state
      },

      GetReplaceableIdentifiers() {
        return state
      },

      ReplaceIdentifiers() {
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
      },
    }),
    _: () => state,
  })
}
