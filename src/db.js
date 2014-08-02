"use strict";
var Dexie = require('Dexie')
  , BackboneRelationalAddon = require('./backbone_relational_addon')
  , db

Dexie.addons.push(BackboneRelationalAddon);

module.exports = db = new Dexie('PeriodO')

db.version(1).stores({
  dumps: 'id++,modified,synced',
  periodizations: 'id,source.id,source.title,source.yearPublished', // Will include sources also
  periods: 'id,label',
  creators: 'id,name',
  spatialItems: 'id,label'
});

var Periodization = require('./models/periodization');
db.periodizations.mapToModel(Periodization);

var Period = require('./models/period');
db.periods.mapToModel(Period);

var Creator = require('./models/creator');
db.creators.mapToModel(Creator);

var SpatialItem = require('./models/spatial_item');
db.spatialItems.mapToModel(SpatialItem);

db.open();
