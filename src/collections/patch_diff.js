"use strict";

var Backbone = require('backbone')
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
  }
});

PatchDiffCollection.fromDatasets = function (from, to) {
  var patch = patchUtils.makePatch(from, to);
  return new PatchDiffCollection(patch);
}

module.exports = PatchDiffCollection;
