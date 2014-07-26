"use strict";

var assert = require('assert')
  , _ = require('underscore')
  , BackboneRelationalAddon = require('../backbone_relational_addon')
  , Backbone = require('backbone')
  , models = {}

require('backbone-relational');

// Sets up the following model hierarchy:
// - M1 (top-level; persisted in indexeddb)
//   - M2 (one-to-many; persisted in indexeddb)
//     - M3 (one-to-many; persisted in indexeddb)
//   - M4 (one-to-one; NOT persisted in indexeddb)
//     - M5 (one-to-many; persisted in indexeddb)

models.M1 = Backbone.RelationalModel.extend({
  relations: [
    {
      type: 'hasMany',
      key: 'm2',
      relatedModel: 'M2'
    },
    {
      type: 'hasOne',
      key: 'm4',
      relatedModel: 'M4'
    }
  ],
});
models.M2 = Backbone.RelationalModel.extend({
  relations: [
    {
      type: 'hasMany',
      key: 'm3',
      relatedModel: 'M3'
    }
  ]
});
models.M3 = Backbone.RelationalModel.extend({})
models.M4 = Backbone.RelationalModel.extend({
  relations: [
    {
      type: 'hasMany',
      key: 'm5',
      relatedModel: 'M5'
    }
  ]
});
models.M5 = Backbone.RelationalModel.extend({});

function makeTestData() {
  return {
    id: 10,
    title: 'I am m1',
    m2: [
      { id: 20, title: 'I am the first m2' },
      { id: 21, title: 'I am the second m2', m3: [ { id: 30, title: 'I am m3' } ] }
    ],
    m4: {
      id: 40,
      title: 'I am m4',
      m5: [
        { id: 50, title: 'I am m5', nested: { foo: 'bar' } }
      ]
    }
  }
}


describe('Backbone-relational Dexie addon', function () {
  var Dexie = require('Dexie')
    , testData = makeTestData()
    , db

    Dexie.addons.push(BackboneRelationalAddon);

    before(function (done) {
      db = new Dexie('testdb');

      db.version(1).stores({
        m1Store: 'id++',
        m2Store: 'id++',
        m3Store: 'id++',
        m5Store: 'id++'
      });

      Backbone.Relational.store.addModelScope(models);

      db.m1Store.mapToModel(models.M1);
      db.m2Store.mapToModel(models.M2);
      db.m3Store.mapToModel(models.M3);
      db.m5Store.mapToModel(models.M5);

      db.open().then(done)
    });

    after(function (done) {
      Backbone.Relational.store.reset();
      db.delete().then(done);
    });


    it('should have mapped models to tables', function () {
      assert.equal(db.table('m1Store').schema.mappedModel, models.M1);
      assert.equal(db.table('m1Store').schema.mappedModel.prototype.storeName, 'm1Store');
    });

    it('should be able to return all objectStores affected by table relations', function () {
      assert.deepEqual(
        [db.table('m5Store')],
        db.table('m5Store').getAllRelatedTables()
      )

      assert.deepEqual(
        ['m1Store', 'm2Store', 'm3Store', 'm5Store'].map(db.table),
        db.table('m1Store').getAllRelatedTables()
          .sort(function (table1, table2) { return table1.name > table2.name })
      )
    });

    it('should partition data by store', function () {
      var testData = makeTestData()
        , partitioned = db.table('m1Store').partitionDataByStore(testData);

      assert.deepEqual(partitioned, {
        m1Store: [
          {
            id: 10,
            title: 'I am m1',
            m2: [ 20, 21 ],
            m4: {
              id: 40,
              title: 'I am m4',
              m5: [ 50 ]
            }
          }
        ],
        m2Store: [
          { id: 20, title: 'I am the first m2' },
          { id: 21, title: 'I am the second m2', m3: [ 30 ] }
        ],
        m3Store: [
          { id: 30, title: 'I am m3' }
        ],
        m5Store: [
          { id: 50, title: 'I am m5', nested: { foo: 'bar' } }
        ]
      });
    });

    it('should know what data to update', function () {
      var newData = makeTestData()
        , editedObj = newData.m2[1].m3[0]

      editedObj.whatever = 'something';

      assert(
        db.m1Store.getDataToUpdate(testData, newData),
        { 'save': { m3Store: editedObj }, 'delete': {} }
      );
    });

    it('should store data from models', function (done) {
      var testData = makeTestData()
        , table = db.m1Store;

      return db.transaction('rw', table.getAllRelatedTables(), function () {
        return table.putModel(testData);
      }).then(function (returned) {
        assert.deepEqual(returned, testData);
        return table.getModel(testData.id);
      }).then(function (returned) {
        assert.deepEqual(returned, testData);
        return db.m2Store.getModel(21);
      }).then(function (returned) {
        assert.deepEqual(returned, {
          id: 21,
          title: 'I am the second m2',
          m3: [
            { id: 30, title: 'I am m3' }
          ]
        });
        done();
      });
    });

});
