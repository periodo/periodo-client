"use strict";

const test = require('tape')
    , FDBFactory = require('fake-indexeddb/lib/FDBFactory')


const makeMocks = () => ({
  indexedDB: new FDBFactory(),
  IDBKeyRange: require('fake-indexeddb/lib/FDBKeyRange')
})

test('IndexedDB local storage', function (t) {
  t.plan(2);

  const mocks = makeMocks();
  const testDB = require('../storage/idb_backend')('test', mocks);

  testDB.on('ready', () => {
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
});
