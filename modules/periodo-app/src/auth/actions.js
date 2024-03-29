"use strict";

const R = require('ramda')
    , { makeTypedAction } = require('org-async-actions')

const AuthAction = makeTypedAction({
  GetAllSettings: {
    exec: getApplicationSettings,
    request: {},
    response: {
      settings: Object,
    },
  },

  UpdateSettings: {
    exec: updateApplicationSettings,
    request: {
      fn: Function,
    },
    response: {
      settings: Object,
    },
  },
})

function getApplicationSettings() {
  return async (dispatch, getState, { db }) => {
    const settings = await db.settings.toArray()

    return { settings: R.dissoc('id', settings[0]) }
  }
}

function updateApplicationSettings(fn) {
  return async (dispatch, getState, { db }) => {
    const [ settings ] = await db.settings.toArray()
        , { id } = settings
        , newSettings = fn(R.dissoc('id', settings))

    await db.settings.put(R.mergeRight(newSettings, { id }))

    return { settings: newSettings }
  }
}

module.exports = AuthAction
