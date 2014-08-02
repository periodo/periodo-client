"use strict";

var _ = require('underscore')
  , Dexie = require('Dexie')
  , Backbone = require('backbone')
  , traverse = require('traverse')
  , equal = require('deep-equal')
  , stableStringify = require('json-stable-stringify')

require('backbone-relational');

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

    var RelModel = _.chain(CurModel.prototype.relations || [])
      .where({ key: attr })
      .pluck('relatedModel')
      .first()
      .value();

    if (RelModel && _.isString(RelModel)) {
      RelModel = Backbone.Relational.store.getObjectByName(RelModel);
    }

    return RelModel;
  }, Model);

  if (relatedModel && !relatedModel.prototype.hasOwnProperty('storeName')) relatedModel = null;

  return relatedModel || null;
}


module.exports = function (db) {

  /*
   * Partitions data by the objectStores that it must be saved in.
   *
   * Returns a dict in the form { objectStoreName: data }
   */
  db.Table.prototype.partitionDataByStore = function (data) {
    var toCheck = []
      , toSave = {}
      , curObj
      , curStore

    toCheck.push({ Model: this.schema.mappedModel, data: data });
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
          (_.isArray(val) ? val : [val]).forEach(function (data) {
            toCheck.push({ Model: StoredModel, data: data });
          });
          this.update(_.pluck(val, StoredModel.prototype.idAttribute), true);
        }
      }));
    }

    _.forEach(toSave, function (val, storeName) {
      var idAttribute = db.table(storeName).schema.mappedModel.prototype.idAttribute;
      toSave[storeName] = val.sort(function (a, b) {
        return a[idAttribute] > b[idAttribute];
      });
    });

    return toSave;
  }

  /*
   * Saves the partioned data created by the previous function.
   */
  db.savePartionedData = function (data) {
    var that = this
      , promises = []

    _(data).forEach(function (values, storeName) {
      values = _.isArray(values) ? values : [values];
      values.forEach(function (val) {
        promises.push(that.table(storeName).put(val));
      });
    });

    return promises;
  }


  // Registers a model constructor to an objectStore
  db.Table.prototype.mapToModel = function (Model) {
    /*
    var existingObjectStores = _(db.tables).pluck('name');
    if (existingObjectStores.indexOf(storeName) === -1) {
      throw 'Object store ' + storeName + ' does not exist.';
    }
    */

    this.schema.mappedModel = Model;
    Model.prototype.storeName = this.name;
  }

  // Returns an array of all tables that must be opened in a transaction to edit
  // the table.
  db.Table.prototype.getAllRelatedTables = function () {
    var toCheck = [this.schema.mappedModel]
      , tables = []
      , CurModel
      , storeName
      , skip

    while (toCheck.length) {
      CurModel = toCheck.pop();
      storeName = CurModel.prototype.storeName;
      skip = false;
      if (storeName) {
        if (tables.indexOf(storeName) === -1) {
          tables.push(storeName);
        } else {
          skip = true;
        }
      }
      if (!skip) {
        (CurModel.prototype.relations || []).forEach(function (rel) {
          var RelModel = _.isString(rel.relatedModel) ?
            Backbone.Relational.store.getObjectByName(rel.relatedModel)
            : rel.relatedModel;

          toCheck.push(RelModel);
        });
      }
    }

    return tables.map(function (name) { return db.table(name) });
  }


  // Retrieves an instance of the model registered with the given table.
  db.Table.prototype.getModel = function (id) {
    var model = this.schema.mappedModel;
    // TODO: if (!model) .......
    
    var _db = Dexie.currentTransaction ? Dexie.currentTransaction.db : db;
    
    return _db[model.prototype.storeName].get(id).then(function (data) {
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
              return _db[relatedModel.prototype.storeName].getModel(pk);
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

  db.Table.prototype.getAllModels = function (options) {
    var _db = Dexie.currentTransaction.db || db;
    var model = this.schema.mappedModel;
    var table = _db[model.prototype.storeName];

    options = options || {};
    options.limit = options.limit || 25;
    options.offset = options.offset || 0;

    return _db[model.prototype.storeName]
      .toCollection()
      .offset(options.offset)
      .limit(options.limit)
      .keys()
      .then(function (keys) {
        var promises = keys.map(function (key) { return table.getModel(key) });
        return Dexie.Promise.all(promises)
      });
  }

  // Put JSON into the given table.
  db.WriteableTable.prototype.putModel = function (object) {
    // TODO: if json object doesn't have needed keypath, throw error
    
    var toSave = this.partitionDataByStore(object);
    var promises = db.savePartionedData(toSave);

    return Dexie.Promise.all(promises).then(function () {
      return Dexie.Promise.resolve(object);
    });
  }

  db.WriteableTable.prototype.putModels = function () {
    var that = this;
    var objects = Array.prototype.slice.call(arguments);
    var toSave = objects.reduce(function (acc, object) {
      var partitioned = that.partitionDataByStore(object);
      for (var store in partitioned) {
        if (!acc.hasOwnProperty(store)) acc[store] = [];
        acc[store] = acc[store].concat(
          _.isArray(partitioned[store]) ? partitioned[store] : [partitioned[store]]
        );
      }
      return acc
    }, {});

    for (var store in toSave) {
      toSave[store] = _.unique(toSave[store], false, stableStringify);
    }

    return Dexie.Promise.all(db.savePartionedData(toSave)).then(function () {
      return Dexie.Promise.resolve(objects);
    });
  }

  db.WriteableTable.prototype.getDataToUpdate = function (existingData, newData) {
    var that = this
      , newByTable
      , existingByTable
      , toDelete

    if (equal(newData, existingData)) {
      return { 'save': {}, 'delete': {} }
    }

    newByTable = this.partitionDataByStore(newData);
    existingByTable = this.partitionDataByStore(existingData);
    toDelete = {};

    _(existingByTable).forEach(function (existingItems, tableName) {
      var idAttribute = db.table(tableName).schema.mappedModel.prototype.idAttribute;

      if (tableName === that.name) return;

      existingItems.forEach(function (item) {
        var newItems = newByTable[tableName];
        var exists = false;

        for (var i = 0; i < newItems.length; i++) {
          if (newItems[i][idAttribute] !== item[idAttribute]) continue;

          exists = true;
          if (equal(newItems[i], item)) newItems.splice(i, 1);
          break;
        }

        if (!exists) {
          if (!(tableName in toDelete)) toDelete[tableName] = [];
          toDelete[tableName].push(item[idAttribute]);
        }
      });
    });

    return { 'save': newByTable, 'delete': toDelete }
  }

  db.WriteableTable.prototype.updateModel = function (newData, existingData) {
    var _db = Dexie.currentTransaction.db || db
      , updates = this.getDataToUpdate(existingData, newData)
      , promises = []

    promises = promises.concat(_(updates['delete']).map(function (ids, storeName) {
      var table = _db.table(storeName);
      return ids.map(table.delete.bind(table));
    }));

    // This needs to be putModel, not just put
    promises = promises.concat(_db.savePartionedData(updates.save));

    return Dexie.Promise.all(promises).then(function () {
      return Dexie.Promise.resolve(newData);
    });
  }

}
