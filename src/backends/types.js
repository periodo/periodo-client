"use strict";

const Type = require('union-type')
    , { isURL } = require('../common/utils')
    , { makeActionType } = require('../common/types')

function isDataset(obj) {
  return (
    typeof obj === 'object' &&
    typeof obj.periodCollections === 'object'
  )
}

function nullableNumber(n) {
  return n === null || typeof n === 'number'
}

const Backend = Type({
  IndexedDB: { id: nullableNumber },
  Web: { url: isURL },
  Memory: {},
  Canonical: {},
})

const BackendMetadata = Type({
  BackendMetadata: {
    label: String,
    description: String,
    created: Date,
    modified: Date,
    accessed: Date,
  }
})

const BackendAction = makeActionType('backend', {
  GetAllBackends: {},

  GetBackend: {
    backend: Backend,
    setAsActive: Boolean
  },

  CreateBackend: {
    backend: Backend,
    label: String,
    description: String,
  },

  UpdateBackend: {
    backend: Backend,
    newDataset: isDataset
  },

  DeleteBackend: [Backend],
  GenerateDatasetPatch: [isDataset, isDataset, String],
  UnsetCurrentBackend: [],
})

module.exports = {
  Backend,
  BackendMetadata,
  BackendAction,
}
