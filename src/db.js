"use strict";

var Dexie = require('dexie')
  , _ = require('underscore')
  , jsonpatch = require('fast-json-patch')
  , patchUtils = require('./utils/patch')

var DUMPID = 1;

var d = {};

module.exports = function (dbName) {
  if (!d.hasOwnProperty(dbName)) {
    d[dbName] = openDB(dbName);
  }

  return d[dbName];
}

function openDB(dbName) {
  var db = new Dexie(dbName);

  /*
   *
   * FIXME: There shouldn't be anyone on old versions of the DB, so maybe we
   * should bump the version to 10 and get rid of these migrations while we
   * still can
   *
   */
  db.version(7).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affectedCollections,*affectedPeriods,*forwardHashes,*backwardHashes,type',
    localPatches: 'id&,resolved',
    idMap: 'id&,serverURL,localID'
  })

  db.version(6).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affectedCollections,*affectedPeriods,*forwardHashes,*backwardHashes,type',
    localPatches: 'id&,resolved'
  }).upgrade(function (tx) {
    tx.table('localData').get(DUMPID).then(function (localData) {
      var data = localData.data;
      tx.table('patches').orderBy('id').reverse().modify(function (patch) {
        var after = JSON.parse(JSON.stringify(data))
          , before
          , newForward
          , newBackward

        jsonpatch.apply(data, patch.backward);

        before = data;

        newForward = patchUtils.transformSimplePatch(patch.forward, { before: before, after: after });
        newBackward = patchUtils.transformSimplePatch(patch.backward, { before: after, after: before });

        patch.forward = newForward;
        patch.backward = newBackward;

        patch.forwardHashes = patch.forward.map(patchUtils.hashPatch);
        patch.backwardHashes = patch.backward.map(patchUtils.hashPatch);
      });
    });
  });

  db.version(5).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affectedCollections,*affectedPeriods,*forwardHashes,*backwardHashes,type'
  }).upgrade(function (tx) {
    tx.table('patches').toCollection().modify(function (patch) {
      delete patch.fowardHash;
      delete patch.backwardHash;

      patch.forwardHashes = patch.forward.map(patchUtils.hashPatch);
      patch.backwardHashes = patch.backward.map(patchUtils.hashPatch);
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

      affected = patchUtils.getAffected(patch.forward);
      patch.affectedCollections = _.unique(affected.collections);
      patch.affectedPeriods = _.unique(affected.periods);
    });
  });


  db.version(3).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affected,forwardHash,backwardHash,type'
  }).upgrade(function (tx) {
    tx.table('patches').toCollection().modify(function (patch) {
      patch.type = patchUtils.classifyPatchSet(patch);
    });
  });


  db.version(2).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affected,forwardHash,backwardHash'
  }).upgrade(function (tx) {
    tx.table('patches').toCollection().modify(function (patch) {
      patch.forwardHash = patchUtils.hashPatch(patch.forward);
      patch.backwardHash = patchUtils.hashPatch(patch.backward);
    });
  });

  db.version(1).stores({
    dumps: 'id&,modified,synced',
    localData: 'id&,modified',
    patches: 'id++,created,*affected'
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

  // Update the local data to given state. This will generate forwards and
  // backwards patches as well as their hashes (to be matched against later when
  // detecting changes.)
  db.updateLocalData = function (newData, message) {
    return db.transaction('rw', db.localData, db.patches, function () {
      return db.getLocalData().then(oldData => {
        var patchData = patchUtils.formatPatch(oldData.data, newData, message)
          , localData = { id: DUMPID, data: newData, modified: new Date().getTime() }
          , promises = []

        promises.push(db.localData.put(localData));
        promises.push(db.patches.put(patchData));

        return Dexie.Promise.all(promises).then(() => newData)
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
