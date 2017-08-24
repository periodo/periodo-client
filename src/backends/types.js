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

BackendStorage.prototype.isEditable = function () {
  return this.case({
    IndexedDB: () => true,
    Memory: () => true,
    _: () => false,
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

Backend.prototype.isEditable = function () {
  return this.storage.isEditable();
}

const BackendAction = makeActionType('backend', {
  GetAllBackends: [
    {},
    {
      backends: Type.ListOf(Backend),
    }
  ],

  GetBackendDataset: [
    {
      storage: BackendStorage,
    },
    {
      backend: Backend,
      dataset: isDataset,
    }
  ],

  GetBackendHistory: [
    {
      storage: BackendStorage,
    },
    {
      // TODO: make this "patch" type
      patches: Type.ListOf(Object)
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

  UpdateLocalDataset: [
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

  UpdateBackend: [
    {
      storage: BackendStorage,
      withObj: Object,
    },
    {
      backend: Backend,
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
