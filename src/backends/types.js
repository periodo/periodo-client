"use strict";

const Type = require('union-type')
    , makeActionType = require('../typed-actions/make_type')
    , { isDataset } = require('lib/util/dataset')
    , { isURL } = require('lib/util/misc')

const BackendStorage = Type({
  Web: { url: isURL },
  IndexedDB: { id: x => x === null || Number.isInteger(x) },
  Memory: {},
  Canonical: {},
})

BackendStorage.prototype.asIdentifier = function () {
  return this.case({
    IndexedDB: id => `local-${id}`,
    Web: url => `web-${url}`,
    _: () => {
      throw new Error('not yet')
    }
  })
}

BackendStorage.fromIdentifier = identifier => {
  const [type, id] = identifier.split('-')

  switch (type) {
    case 'web':
      return BackendStorage.Web(decodeURIComponent(id));

    case 'local':
      return BackendStorage.IndexedDB(parseInt(id));

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

const Backend = Type({
  Backend: {
    metadata: BackendMetadata,
    storage: BackendStorage,
  }
})

Backend.prototype.asIdentifier = function () {
  return this.storage.asIdentifier();
}

const BackendAction = makeActionType('backend', {
  GetAllBackends: [
    {},
    {
      backends: Type.ListOf(Backend),
    }
  ],

  GetBackend: [
    {
      storage: BackendStorage,
    },
    {
      backend: Backend,
      dataset: isDataset,
    }
  ],

  CreateBackend: [
    {
      storage: BackendStorage,
      label: String,
      description: String,
    },
    {
      backend: Backend,
    }
  ],

  UpdateBackend: [
    {
      storage: BackendStorage,
      newDataset: isDataset
    },
    {
      backend: Backend,
      dataset: isDataset,
      patchData: Object,
    }
  ],

  DeleteBackend: [
    {
      storage: BackendStorage,
    },
    {}
  ],
})

module.exports = {
  Backend,
  BackendMetadata,
  BackendStorage,
  BackendAction,
}
