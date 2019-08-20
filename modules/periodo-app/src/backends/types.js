"use strict";

const Type = require('union-type')
    , isURL = require('is-url')

const BackendStorage = Type({
  Web: { url: isURL },
  IndexedDB: {
    id: x => x === null || Number.isInteger(x),
  },
  StaticFile: {
    id: x => x === null || Number.isInteger(x),
    file: x => x instanceof File,
  },
  Memory: {},
  Canonical: {},
})

BackendStorage.prototype.asIdentifier = function () {
  return this.case({
    Web: url => `web-${url}`,
    IndexedDB: id => `local-${id}`,
    StaticFile: id => `file-${id}`,
    _: () => {
      throw new Error('not yet')
    },
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
  const [ type, id ] = identifier.split('-')

  switch (type) {
  case 'web':
    return BackendStorage.Web(decodeURIComponent(id));

  case 'local':
    return BackendStorage.IndexedDB(parseInt(id));

  case 'file':
    throw new Error('Cannot create StaticFile storage objects through this constructor')

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
    orcidCredential: x =>
      x == null || (
        typeof x === 'object' &&
        typeof x.name === 'string' &&
        typeof x.token === 'string'
      ),
  },
})

const Backend = Type({
  Backend: {
    metadata: BackendMetadata,
    storage: BackendStorage,
  },
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
