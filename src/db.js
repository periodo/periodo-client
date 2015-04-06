"use strict";

var Dexie = require('dexie')
  , _ = require('underscore')
  , md5 = require('spark-md5')
  , patchUtils = require('./utils/patch')

var SYNC = 10
  , MULTIPLE = 11
  , CREATE_PERIOD_COLLECTION = 20
  , DELETE_PERIOD_COLLECTION = 30
  , EDIT_PERIOD_COLLECTION = 40
  , CREATE_PERIOD = 50
  , DELETE_PERIOD = 60
  , EDIT_PERIOD = 70

var DUMPID = 1;

function classifyPatch(patch) {
  var patchUtils = require('./utils/patch')
    , classified = patchUtils.classifyDiff(patch.path)

  if (classified.type === 'periodCollection' || classified.type === 'period') {
    if (!classified.label) {
      if (patch.op === 'add') {
        classified._type = classified.type === 'periodCollection' ?
          CREATE_PERIOD_COLLECTION : CREATE_PERIOD;
      } else {
        classified._type = classified.type === 'periodCollection' ?
          DELETE_PERIOD_COLLECTION : DELETE_PERIOD;
      }
    } else {
      classified._type = classified.type === 'periodCollection' ?
        EDIT_PERIOD_COLLECTION : EDIT_PERIOD;
    }
  }

  return classified;
}

function getType(patchObj) {
  var type
    , classified

  if (!!patch.message.match('synced data')) {
    type = SYNC;
  } else if (patch.forward.length > 1) {
    type = MULTIPLE;
  } else {
    classified = classifyPatch(patch.forward[0]);
    type = classified._type;
  }

  return type;
}

function getAffected(patches) {
  return patches.reduce(function (acc, p) {
    var classified = classifyPatch(p);
    if (classified.type === 'period') {
      acc.periods.push(classified.id);
      acc.collections.push(classified.collection_id);
    } else if (classified.type === 'periodCollection') {
      acc.collections.push(classified.id);
    }
    return acc;
  }, { periods: [], collections: [] });
}

module.exports = function (dbName) {
  var db = new Dexie(dbName);

  db.version(1).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affected'
  });

  db.version(2).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affected,forwardHash,backwardHash'
  }).upgrade(function (tx) {
    tx.table('patches').toCollection().modify(function (patch) {
      patch.forwardHash = md5.hash(JSON.stringify(patch.forward));
      patch.backwardHash = md5.hash(JSON.stringify(patch.backward));
    });
  });

  db.version(3).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affected,forwardHash,backwardHash,type'
  }).upgrade(function (tx) {
    tx.table('patches').toCollection().modify(function (patch) {
      patch.type = getType(patch);
    });
  });

  db.version(4).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affectedCollections,*affectedPeriods,forwardHash,backwardHash,type'
  }).upgrade(function (tx) {
    tx.table('patches').toCollection().modify(function (patch) {
      var affected;

      delete patch.affected;

      affected = getAffected(patch.forward);
      patch.affectedCollections = _.unique(affected.collections);
      patch.affectedPeriods = _.unique(affected.periods);
    });
  });

  db.on('populate', function () {
    // Create an initial, empty dataset.
    db.localData.put({
      id: DUMPID,
      data: { periodCollections: {}, type: 'rdf:Bag' },
      modified: new Date().getTime()
    });
  });

  db.getLocalData = function () { return db.localData.get(DUMPID) }

  /* Generates a patch that will transform the stored local data to `newData` */
  db.makeLocalPatch = function (newData) {
    return db.getLocalData().then(function (oldData) {
      var forward = patchUtils.makePatch(oldData.data, newData)
        , backward = patchUtils.makePatch(newData, oldData.data)

      return {
        forward: forward,
        backward: backward,
      }
    });
  }

  db.updateLocalData = function (newData, message) {

    return db.transaction('rw', db.localData, db.patches, function () {
      return db.makeLocalPatch(newData).then(function (patches) {
        var promises = []
          , affected = getAffected(patches.forward)
          , localData
          , patchData

        localData = {
          id: DUMPID,
          data: newData,
          modified: new Date().getTime()
        }

        patchData = {
          forward: patches.forward,
          forwardHash: md5.hash(JSON.stringify(patches.forward)),
          backward: patches.backward,
          backwardHash: md5.hash(JSON.stringify(patches.backward)),
          created: new Date().getTime(),
          message: message,
          affectedCollections: affected.collections,
          affectedPeriods: affected.periods
        }

        patchData.type = getType(patchData);

        promises.push(db.localData.put(localData));
        promises.push(db.patches.put(patchData));

        return Dexie.Promise.all(promises).then(Dexie.Promise.resolve({
          localData: localData,
          patches: patchData
        }));
      });
    });
  }


  db.updateDumpData = function (newValue) {
    newValue.id = DUMPID;
    return db.dumps.put(newValue);
  }

  db.open();
  return db;
}
