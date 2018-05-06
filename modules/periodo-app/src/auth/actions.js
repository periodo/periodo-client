"use strict";

const R = require('ramda')
    , { AuthAction } = require('./types')

function getApplicationSettings() {
  const action = AuthAction.GetAllSettings

  return action.do(async (dispatch, getState, { db }) => {
    const settings = await db.settings.toArray()

    return { settings: R.dissoc('id', settings[0]) }
  })
}

function updateApplicationSettings(fn) {
  const action = AuthAction.UpdateSettings(fn)

  return action.do(async (dispatch, getState, { db }) => {
    const [settings] = await db.settings.toArray()
        , { id } = settings
        , newSettings = fn(R.dissoc('id', settings))

    debugger;

    await db.settings.put(R.merge(newSettings, { id }))

    return { settings: newSettings }
  })
}

module.exports = {
  getApplicationSettings,
  updateApplicationSettings,
}
