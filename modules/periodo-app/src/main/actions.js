"use strict";

const { makeTypedAction } = require('org-async-actions')

module.exports = makeTypedAction({
  InitIndexedDB: {
    exec: initIndexedDB,
    request: {},
    response: {},
  },

  RequestPersistence: {
    exec: requestPersistence,
    request: {},
    response: {
      isPersisted: Boolean,
    },
  },

  CheckPersistence: {
    exec: checkPersistence,
    request: {},
    response: {
      isPersisted: Boolean,
    },
  },
})

const persistenceAPISupported = (
  typeof navigator !== 'undefined' &&
  'storage' in navigator &&
  'persisted' in navigator.storage
)

function initIndexedDB() {
  return async (dispatch, getState, { db }) => {
    await db.open()

    return {}
  }
}

function requestPersistence() {
  return async () => {
    let isPersisted = false

    if (persistenceAPISupported) {
      isPersisted = await navigator.storage.persisted()

      if (!isPersisted) {
        isPersisted = await navigator.storage.persist()
      }
    }

    return { isPersisted }
  }
}

function checkPersistence() {
  return async () => {
    let isPersisted = false

    if (persistenceAPISupported) {
      isPersisted = await navigator.storage.persisted()
    }

    return { isPersisted }
  }
}
