"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , Dexie = require('dexie')
  , md5 = require('spark-md5')
  , stringify = require('json-stable-stringify')
  , patchUtils = require('../utils/patch')
  , PatchDiff = require('../models/patch_diff')
  , PatchDiffCollection

function hashPatch(patch) { return md5.hash(stringify(patch)) }

PatchDiffCollection = Backbone.Collection.extend({
  model: PatchDiff,
  asDescription: function () {
    var ret = {
      periodCollection: { add: [], remove: [], edit: {} },
      period: { add: [], remove: [], edit: {} }
    }

    return this.reduce(function (acc, diff) {
      var changeDescription = diff.classify()

      if (!changeDescription) return acc;

      if (changeDescription.type === 'period' || changeDescription.type === 'periodCollection') {
        if (!changeDescription.label) {
          let key = diff.get('op') === 'add' ? 'add' : 'remove';
          acc[changeDescription.type][key].push(diff.cid);
        } else {
          let action = acc[changeDescription.type].edit
            , collectionId = changeDescription.collection_id
            , id = changeDescription.id

          if (collectionId) {
            // This is a period
            if (!action.hasOwnProperty(collectionId)) action[collectionId] = {};
            if (!action[collectionId].hasOwnProperty(id)) action[collectionId][id] = [];
            action[collectionId][id].push(diff.cid);
          } else {
            if (!action.hasOwnProperty(id)) action[id] = {};
            action[id][diff.cid] = changeDescription.label;
          }
        }
      }

      return acc;
    }, ret);
  },
  groupFakeReplacements: function () {
    return this.reduce((arr, patch, idx) => {
      var lastThing = arr.slice(-1)[0]
        , isFakeDelete

      if (lastThing && lastThing[1] === patch) return arr;

      isFakeDelete = (
        patch.get('op') === 'remove' && 
        this.at(idx + 1).get('path') === patch.get('path')
      );

      if (isFakeDelete) {
        let patchCouple = [patch];
        patchCouple.push(this.at(idx + 1));
        arr.push(patchCouple);
      } else {
        arr.push(patch);
      }

      return arr;
    }, []);
  },
  filterByHash: function () {
    var db = require('../db')
      , to = this.datasets.to
      , patches = this.groupFakeReplacements()
      , promises = []
      , hashesToCheck

    hashesToCheck = patches.filter(Array.isArray).reduce((acc, patchSet) => {
      var hash = hashPatch(patchSet[1]);
      acc[hash] = patchSet;
      return acc;
    }, {});

    patches.filter(patch => patch.op === 'remove').forEach(patch => {
      var hash = hashPatch(patch);
      hashesToCheck[hash] = patch;
    });

    promises.push(patches.filter(patch => patch.get('op') === 'add'));
    if (!_.isEmpty(hashesToCheck)) {
      promises.push(db(localStorage.currentBackend)
        .patches
        .where(to === 'remote' ? 'forwardHashes' : 'backwardHashes')
        .anyOf(Object.keys(hashesToCheck).sort())
        .uniqueKeys()
        .then(hashes => {
          // For patch generation option, include *only* those edits that have
          // matching forward hashes in the patch history.
          // 
          // For sync operations, remove all edits that have matching backwards
          // hashes in the patch history.
          return _.flatten(to === 'remote' ?
            hashes.map(hash => hashesToCheck[hash]) :
            _.values(_.omit(hashesToCheck, hashes)))
        }))
    } else {
      promises.push([]);
    }

    return Dexie.Promise.all(promises)
      .then(([edits, additions]) => additions.concat(edits));
  },
});

PatchDiffCollection.fromDatasets = function ({ local, remote, to }) {
  var patch
    , collection

  if (!local || !remote || (to !== 'local' && to !== 'remote')) {
    throw new Error('Must specify local, remote and to parameters.')
  }

  // Only worry about patches to period collections (this ignores @context,
  // various other things...)
  patch = to === 'local' ?
    patchUtils.makePatch(local, remote) : // Syncing from server
    patchUtils.makePatch(remote, local)   // Submitting patch ("How can we make 

  patch = patch.filter(p => p.path.match(/^\/periodCollection/));
  collection = new PatchDiffCollection(patch);

  collection.datasets = { local, remote, to };

  return collection;
}

module.exports = PatchDiffCollection;
