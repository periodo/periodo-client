"use strict";

const FDBFactory = require('fake-indexeddb/lib/FDBFactory')

function MockLocalStorage() {
  this.data = new Map();
}

MockLocalStorage.prototype = {
  setItem(name, value) {
    return this.data.set(name, value);
  },

  getItem(name) {
    return this.data.get(name);
  },
}

module.exports = function makeMockStorage() {
  return {
    indexedDB: new FDBFactory(),
    IDBKeyRange: require('fake-indexeddb/lib/FDBKeyRange'),
    localStorage: new MockLocalStorage(),
  }
}
