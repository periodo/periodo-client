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
        , action
        , key

      if (!changeDescription) return acc;

      if (changeDescription.type === 'period' || changeDescription.type === 'periodCollection') {
        if (!changeDescription.label) {
          key = diff.get('op') === 'add' ? 'add' : 'remove';
          acc[changeDescription.type][key].push(diff.cid);
        } else {
          action = acc[changeDescription.type].edit;
          if (!action.hasOwnProperty(changeDescription.label)) {
            action[changeDescription.label] = [];
          }

          action[changeDescription.label].push(diff.cid);
        }
      }

      return acc;
    }, ret);
  },
  withoutLocalChanges: function () {
    var md5 = require('spark-md5')
      , stringify = require('json-stable-stringify')
      , db = require('../db')
      , that = this
      , currentBackend = localStorage.currentBackend
      , remoteHashes
      , localEditsPromise

    remoteHashes = this.reduce(function (acc, patch) {
      var hash = md5.hash(stringify(patch));
      acc[hash] = patch.cid;
      return acc;
    }, {});

    // Edits that were only made locally and should not be included in the
    // patch set

    if (_.isEmpty(remoteHashes)) {
      localEditsPromise = Dexie.Promise.resolve([]);
    } else {
      localEditsPromise = db(currentBackend)
        .patches
        .where('backwardHashes')
        .anyOf(Object.keys(remoteHashes).sort())
        .uniqueKeys()
        .then(function (hashes) {
          return hashes.map(function (hash) {
            return remoteHashes[hash];
          });
        });
    }

    return localEditsPromise.then(function (localEdits) {
      var changes = { localReverse: [], remote: [] }

      for (var i = 0; i < that.models.length; i++) {
        if (localEdits.indexOf(that.models[i].cid) === -1) {
          changes.remote.push(that.models[i]);
        } else {
          changes.localReverse.push(that.models[i]);
        }
      }

      return changes;
    });
  }
});

PatchDiffCollection.fromDatasets = function (from, to) {
  var patch
    , collection

  // Only worry about patches to period collections (this ignores @context,
  // various other things...)
  patch = patchUtils.makePatch(from, to).filter(function (p) {
    return p.path.match(/^\/periodCollection/);
  });
  collection = new PatchDiffCollection(patch)

  collection.datasets = { from: from, to: to };

  return collection;
}

module.exports = PatchDiffCollection;
