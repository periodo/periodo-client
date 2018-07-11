"use strict";

const Type = require('union-type')
    , { isURL } = require('periodo-utils/src/misc')

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


module.exports = {
  Backend,
  BackendMetadata,
  BackendStorage,
}
