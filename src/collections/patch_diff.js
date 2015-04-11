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
  filterByHash: function (keep='local') {
    var db = require('../db')
      , remoteHashes = this.asHashes()
      , promise

    if (keep !== 'local' && keep !== 'remote') {
      throw new Error('Must specify keeping either local or remote hashes.')
    }

    if (_.isEmpty(remoteHashes)) {
      promise = Dexie.Promise.resolve([]);
    } else {
      promise = db(localStorage.currentBackend)
        .patches
        .where(keep === 'local' ? 'forwardHashes' : 'backwardHashes')
        .anyOf(Object.keys(remoteHashes).sort())
        .uniqueKeys()
        .then(hashes => hashes.map(hash => remoteHashes[hash]))
    }

    return promise.then(cids => keep === 'local ' ?
      this.filter(model => cids.indexOf(model.cid) !== -1) :
      this.filter(model => cids.indexOf(model.cid) === -1)
    );
  },
});

PatchDiffCollection.fromDatasets = function (from, to) {
  var patch
    , collection

  // Only worry about patches to period collections (this ignores @context,
  // various other things...)
  patch = patchUtils.makePatch(from, to).filter(p => p.path.match(/^\/periodCollection/));
  collection = new PatchDiffCollection(patch)

  collection.datasets = { from, to };

  return collection;
}

module.exports = PatchDiffCollection;
