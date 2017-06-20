"use strict";

const Type = require('union-type')
    , makeActionType = require('../typed-actions/make_type')
    , { isDataset } = require('lib/util/dataset')
    , { isURL } = require('lib/util/misc')


const Backend = Type({
  Web: { url: isURL },
  IndexedDB: { id: Number },
  UnsavedIndexedDB: {},
  Memory: {},
  Canonical: {},
})


Backend.prototype.asIdentifier = function () {
  return this.case({
    IndexedDB: id => `local-${id}`,
    Web: url => `web-${url}`,
    _: () => {
      throw new Error('not yet')
    }
  })
}

// Static methods
Backend.serialize = backend => JSON.stringify(backend)

Backend.deserialize = str => {
  const obj = JSON.parse(str)

  return Backend[obj._name + 'Of'](obj)
}

Backend.fromIdentifier = identifier => {
  const [type, id] = identifier.split('-')

  switch (type) {
    case 'web':
      return Backend.Web(decodeURIComponent(id));

    case 'local':
      return Backend.IndexedDB(parseInt(id));

    default:
      throw new Error(`Unknown backend type: ${type}`)
  }
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
