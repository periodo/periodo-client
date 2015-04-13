"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , Dexie = require('dexie')
  , patchUtils = require('../utils/patch')
  , PatchDiff = require('../models/patch_diff')
  , PatchDiffCollection

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
            , label = changeDescription.label

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
  asHashes: function () {
    var md5 = require('spark-md5')
      , stringify = require('json-stable-stringify')

    return this.reduce(function (acc, patch) {
      var hash = md5.hash(stringify(patch));
      acc[hash] = patch.cid;
      return acc;
    }, {});
  },
  filterByHash: function () {
    var db = require('../db')
      , to = this.datasets.to
      , diffHashes = this.asHashes()
      , diffDescription = this.asDescription()
      , promises = []

    if (!_.isEmpty(diffHashes)) {
      promises.push(db(localStorage.currentBackend)
        .patches
        .where(to === 'remote' ? 'forwardHashes' : 'backwardHashes')
        .anyOf(Object.keys(diffHashes).sort())
        .uniqueKeys()
        .then(hashes => {
          // For patch generation option, include *only* those edits that have
          // matching forward hashes in the patch history.
          // 
          // For sync operations, remove all edits that have matching backwards
          // hashes in the patch history.
          return to === 'remote' ?
            hashes.map(hash => diffHashes[hash]) :
            _.values(_.omit(diffHashes, hashes))
        }))

      promises.push(Dexie.Promise.resolve(diffDescription.period.add));
      promises.push(Dexie.Promise.resolve(diffDescription.periodCollection.add));
    }

    return Dexie.Promise.all(promises)
      .then(([edits, periodAdditions, periodCollectionAdditions]) => {
        var cids = edits ?  edits.concat(periodAdditions, periodCollectionAdditions) : [];
        return this.filter(model => cids.indexOf(model.cid) !== -1);
      });

    /*
    return promise.then(cids => keep === 'local ' ?
      this.filter(model => cids.indexOf(model.cid) !== -1) :
      this.filter(model => cids.indexOf(model.cid) === -1)
    );
    */
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
