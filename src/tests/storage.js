"use strict";

const test = require('tape')
    , FDBFactory = require('fake-indexeddb/lib/FDBFactory')

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

const makeMocks = () => ({
  indexedDB: new FDBFactory(),
  IDBKeyRange: require('fake-indexeddb/lib/FDBKeyRange'),
  localStorage: undefined
})


/*
test('IndexedDB local storage', t => {
  t.plan(2);

  const mocks = makeMocks();
  const testDB = require('../storage/idb_backend')('test', mocks);

  testDB.localData.count().then(c => {
    t.equal(c, 1, 'has one item set as local data');
  });

  testDB.localData.toArray().then(([localData]) => {
    t.deepEqual(localData.data, {
      periodCollections: {},
      type: 'rdf:Bag'
    }, 'creates an empty dataset on creation');
  });

});

test('Upgrade to global periodo metadata database', t => {
  t.plan(1);

  const mocks = makeMocks();

  delete require.cache[require.resolve('../storage/idb_backend')];
  delete require.cache[require.resolve('../storage/periodo')];
  delete require.cache[require.resolve('dexie')];

  global.indexedDB = mocks.indexedDB;
  global.localStorage = new MockLocalStorage();

  const testDB1 = require('../storage/idb_backend')('test1', mocks);
  const testDB2 = require('../storage/idb_backend')('test2', mocks);

  setTimeout(() => {
    const periodoDB = require('../storage/periodo')(mocks);

    periodoDB.on('ready', () => {
      periodoDB.backends.count().then(ct => {
        debugger;

        console.log('now testing');

        t.equal(ct, 2, 'should add existing periodo backends to available backends');

        delete global.indexedDB;
        delete global.localStorage;
        delete require.cache[require.resolve('dexie')];
        delete require.cache[require.resolve('../storage/idb_backend')];
        delete require.cache[require.resolve('../storage/periodo')];
      });
    });

  }, 100);
});
*/
