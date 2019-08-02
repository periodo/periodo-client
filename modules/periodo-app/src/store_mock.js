"use strict";

const FDBFactory = require('fake-indexeddb/lib/FDBFactory')
    , configureMockStore = require('redux-mock-store').default
    , { typedAsyncActionMiddleware } = require('org-async-actions')

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

module.exports = function () {
  const mockStorage = {
    indexedDB: new FDBFactory(),
    IDBKeyRange: require('fake-indexeddb/lib/FDBKeyRange'),
    localStorage: new MockLocalStorage(),
  }

  return configureMockStore([
    typedAsyncActionMiddleware({ db: require('./db')(mockStorage) }),
  ])()
}
