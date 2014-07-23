"use strict";
var _ = require('underscore')
  , Dexie = require('Dexie')
  , traverse = require('traverse')
  , genid = require('./utils/generate_skolem_id')
  , db

function BackboneRelationalAddon(db) {
  db.Table.prototype.mapToModel = function (backboneModel, storeName) {
    this.schema.mappedModel = backboneModel;
    backboneModel.prototype.storeName = storeName;
  }

  db.getTablesForModel = function (model) {
    var toSave = getStoresWithData(model.toJSON(), model.constructor);
    return _(toSave).map(function (val, storeName) {
      return db.table(storeName);
    });
  }

  db.Table.prototype.getModel = function (id) {
    var model = this.schema.mappedModel;
    return this.get(id).then(function (data) {
      return traverse(data).map(function (val) {
        if (this.isRoot) return;
        var relatedModel = getStoredRelation(model, this.path);
        if (relatedModel) {
          this.update(val.map(function (id) { return { id: id } }), true);
        }
      });
    });
  }

  db.WriteableTable.prototype.putModel = function (object) {
    var toSave = getStoresWithData(object, this.schema.mappedModel);
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

  function getStoredRelation(model, path) {
    var relatedModel = path.reduce(function (curModel, attr) {
      if (!curModel) return null;
      return _.chain(curModel.prototype.relations || [])
        .where({ key: attr })
        .pluck('relatedModel')
        .first()
        .value()
    }, model);

    if (relatedModel && !relatedModel.prototype.hasOwnProperty('storeName')) relatedModel = null;

    return relatedModel || null;
  }

  function getStoresWithData(object, modelConstructor) {
    var toCheck = []
      , toSave = {}
      , curObj
      , curStore

    toCheck.push({ model: modelConstructor, object: object });
    while (toCheck.length) {
      curObj = toCheck.pop();
      curStore = curObj.model.prototype.storeName;
      if (!toSave.hasOwnProperty(curStore)) toSave[curStore] = [];
      toSave[curStore] = toSave[curStore].concat(traverse(curObj.object).map(function (val) {
        if (this.isRoot) return;
        var storedModel = getStoredRelation(curObj.model, this.path);
        if (storedModel) {
          toCheck.push({ model: storedModel, object: val });
          this.update(_.pluck(val, storedModel.prototype.idAttribute), true);
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
