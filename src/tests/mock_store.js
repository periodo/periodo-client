"use strict";

const FDBFactory = require('fake-indexeddb/lib/FDBFactory')
    , thunk = require('redux-thunk').default
    , configureMockStore = require('redux-mock-store')

class MockLocalStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(name, value) {
    return this.data.set(name, value);
  }

  setItem(name) {
    return this.data.get(name);
  }
}

module.exports = function (initialData) {
  const mockStorage = {
    indexedDB: new FDBFactory(),
    IDBKeyRange: require('fake-indexeddb/lib/FDBKeyRange'),
    localStorage: new MockLocalStorage(),
  }

  return configureMockStore([
    thunk.withExtraArgument({ db: require('../db')(mockStorage) })
  ])()
}
