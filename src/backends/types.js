"use strict";

const url = require('url')
    , Type = require('union-type')
    , makeActionType = require('../typed-actions/make_type')
    , { generateRoute } = require('../router')

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

Backend.serialize = backend => JSON.stringify(backend)

Backend.deserialize = str => {
  const obj = JSON.parse(str)

  return Backend[obj._name + 'Of'](obj)
}

const BackendMetadata = Type({
  BackendMetadata: {
    label: String,
    description: String,
    created: Date,
    modified: Date,
    accessed: Date,
  }
})

const _BackendResp = Type({ _BackendResp: {
  type: Backend,
  metadata: BackendMetadata,
}})

const BackendAction = makeActionType('backend', {
  GetAllBackends: [
    {},
    {
      //FIXME: This is not ideal
      backends: Type.ListOf(x => _BackendResp._BackendRespOf(x))
    }
  ],

  GetBackend: [
    { backend: Backend, setAsActive: Boolean },
    {
      type: Backend,
      setAsActive: Boolean,
      isEditable: Boolean,
      metadata: BackendMetadata,
      dataset: isDataset,
    }
  ],

  CreateBackend: [
    { backend: Backend, label: String, description: String, },
    { backend: Backend, metadata: BackendMetadata, }
  ],

  UpdateBackend: [
    { backend: Backend, newDataset: isDataset },
    {
      backend: Backend,
      metadata: BackendMetadata,
      dataset: isDataset,
      patchData: Object,
    }
  ],

  DeleteBackend: [
    { backend: Backend },
    {}
  ],

  UnsetCurrentBackend: [ {}, {} ],
})

module.exports = {
  Backend,
  BackendMetadata,
  BackendAction,
}
