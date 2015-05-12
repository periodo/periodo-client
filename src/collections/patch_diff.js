"use strict";

var Immutable = require('immutable')
  , Backbone = require('backbone')
  , backends = require('../backends')
  , patchUtils = require('../utils/patch')
  , PatchDiff = require('../models/patch_diff')
  , PatchDiffCollection

PatchDiffCollection = Backbone.Collection.extend({
  model: PatchDiff,
  filterByHash: function () {
    var { filterByHash } = require('../helpers/patch_collection')
      , db = require('../db')
      , to = this.datasets.to
      , patches = Immutable.fromJS(this.toJSON())

    function matchHashes(hashes) {
      return db(backends.current().name)
        .patches
        .where(to === 'remote' ? 'forwardHashes' : 'backwardHashes')
        .anyOf(hashes.toArray())
        .uniqueKeys()
    }

    return filterByHash(patches, to === 'remote', matchHashes);
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
