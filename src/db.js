"use strict";
var Dexie = require('Dexie')
  , db

module.exports = db = new Dexie('PeriodO');

db.version(1).stores({
  dumps: 'id++,modified,synced',
  localData: 'id++,modified',
  patches: 'id++'
});

db.open();
