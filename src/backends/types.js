"use strict";

const url = require('url')
    , Type = require('union-type')
    , makeActionType = require('../typed-actions/make_type')

function isDataset(obj) {
  return (
    typeof obj === 'object' &&
    typeof obj.periodCollections === 'object'
  )
}

function isURL(str) {
  if (!(typeof str === 'string')) {
    throw new Error('URL must be a string')
  }

  const { protocol, host } = url.parse(str)

  if (!(protocol && host)) {
    throw new Error(`Invalid URL: ${str}`);
  }

  return true;
}

const Backend = Type({
  Web: { url: isURL },
  IndexedDB: { id: Number },
  UnsavedIndexedDB: {},
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
