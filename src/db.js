"use strict";
var _ = require('underscore')
  , Backbone = require('backbone')
  , Dexie = require('Dexie')
  , traverse = require('traverse')
  , genid = require('./utils/generate_skolem_id')
  , db

function BackboneRelationalAddon(db) {

  // Registers a model constructor to an objectStore
  db.Table.prototype.mapToModel = function (Model, storeName) {
    this.schema.mappedModel = Model;
    Model.prototype.storeName = storeName;
    // TODO: throw error if store doesn't exist
  }

  // Gets all tables that must be opened in a transaction to edit the given
  // model instance.
  db.getTablesForModel = function (model) {
    var toSave = partitionDataByStore(model.toJSON(), model.constructor);
    return _(toSave).map(function (val, storeName) {
      return db.table(storeName);
    });
  }

  // Retrieves an instance of the model registered with the given table.
  db.Table.prototype.getModel = function (id) {
    var that = this;
    var model = this.schema.mappedModel;
    // TODO: if (!model) .......
    
    return this.get(id).then(function (data) {
      var promises = []
        , updatedData

      updatedData = traverse(data).map(function (val) {
        var relatedModel, path;

        if (this.isRoot) return;

        relatedModel = findStoredRelationAtPath(model, this.path);
        path = this.path;

        // If there is a relationship here, stop traversal, fetch the related
        // models from the database, and then update the parent with the result
        if (relatedModel) {
          this.update(val, val, true);
          promises.push(
            Dexie.Promise.all(val.map(function (pk) {
              return db[relatedModel.prototype.storeName].getModel(pk);
            })).then(function (vals) {
              traverse(updatedData).set(path, vals);
            })
          );
        }
      });

      // Once all related fields are resolved, return the updated value
      return Dexie.Promise.all(promises).then(function () { return updatedData });
    });
  }

  // Put JSON into the given table.
  db.WriteableTable.prototype.putModel = function (object) {
    // TODO: if json object doesn't have needed keypath, throw error
    
    var toSave = partitionDataByStore(object, this.schema.mappedModel);
    var promises = [];
    _(toSave).forEach(function (values, storeName) {
      values = _.isArray(values) ? values : [values];
      values.forEach(function (val) {
        var table = db.table(storeName)
          , model = table.schema.mappedModel
          , idAttribute = model.prototype.idAttribute

        if (!val.hasOwnProperty(idAttribute) && model.prototype.skolemID) {
          val[idAttribute] = genid();
        }

        promises.push(db.table(storeName).put(val));
      });
    });
    return Dexie.Promise.all(promises);
  }

  /*
   * Given a model constructor and a path through the JSON serialization
   * of a model instance, traverse the backbone-relational relations on the
   * model and return a model constructor found at that path if one exists and
   * it is stored using indexedDB.
   *
   * returns either a model constructor or null.
   */
  function findStoredRelationAtPath(Model, path) {
    var relatedModel = path.reduce(function (CurModel, attr) {
      if (!CurModel) return null;
      return _.chain(CurModel.prototype.relations || [])
        .where({ key: attr })
        .pluck('relatedModel')
        .first()
        .value()
    }, Model);

    if (relatedModel && !relatedModel.prototype.hasOwnProperty('storeName')) relatedModel = null;

    return relatedModel || null;
  }


  /*
   * Partitions data by the objectStores that it must be saved in.
   *
   * Arguments (either):
   *   - dict and model constructor
   *   - model instance
   *
   * Returns a dict in the form { objectStoreName: data }
   */
  function partitionDataByStore(data, ModelConstructor) {
    var toCheck = []
      , toSave = {}
      , curObj
      , curStore

    if (!ModelConstructor && data instanceof Backbone.Model) {
      ModelConstructor = data.constructor;
      data = data.toJSON();
    }

    toCheck.push({ Model: ModelConstructor, data: data });
    while (toCheck.length) {
      curObj = toCheck.pop();
      curStore = curObj.Model.prototype.storeName;

      // More than one attribute might be part of the same store, like a
      // source's contributors and creators 
      if (!toSave.hasOwnProperty(curStore)) toSave[curStore] = [];

      // Traverse the object, and if any of the values are models stored in
      // indexedDB, replace that value with an array of IDs.
      toSave[curStore] = toSave[curStore].concat(traverse(curObj.data).map(function (val) {
        if (this.isRoot) return;
        var StoredModel = findStoredRelationAtPath(curObj.Model, this.path);
        if (StoredModel) {
          toCheck.push({ Model: StoredModel, data: val });
          this.update(_.pluck(val, StoredModel.prototype.idAttribute), true);
        }
      }));
    }

    return toSave;
  }
}
Dexie.addons.push(BackboneRelationalAddon);

module.exports = db = new Dexie('PeriodO')

db.version(1).stores({
  dumps: '_id++',
  periodizations: 'id,source.id,source.title,source.yearPublished', // Will include sources also
  periods: 'id,label',
  creators: 'id,name',
  spatialItems: 'id,label'
});

var Periodization = require('./models/periodization');
db.periodizations.mapToModel(Periodization, 'periodizations');

var Period = require('./models/period');
db.periods.mapToModel(Period, 'periods');

var Creator = require('./models/creator');
db.creators.mapToModel(Creator, 'creators');

var SpatialItem = require('./models/spatial_item');
db.spatialItems.mapToModel(SpatialItem, 'spatialItems');

db.open();
