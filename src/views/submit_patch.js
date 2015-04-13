"use strict";

var _ = require('underscore')
  , $ = require('jquery')
  , Backbone = require('../backbone')
  , patch = require('fast-json-patch')
  , patchUtils = require('../utils/patch')
  , pointer = require('json-pointer')
  , periodDiff = require('../utils/period_diff')
  , Source = require('../models/source')

module.exports = Backbone.View.extend({
  events: {
    'click #js-find-changes': 'findChanges'
  },
  initialize: function ({ localData }) {
    this.localData = localData;
    this.render();
  },
  render: function () {
    var template = require('../templates/submit_patch.html');
    this.$el.html(template());
  },
  findChanges: function (e) {
    var ajax = require('../ajax')
      , url = this.$('input').val()
      , PatchDiffCollection = require('../collections/patch_diff')

    ajax.getJSON(url + '/d/')
      .then(remoteData => this.collection = PatchDiffCollection.fromDatasets({
        local: this.localData.data,
        remote: remoteData,
        to: 'remote'
      }))
      .then(diffs => diffs.filterByHash())
      .then(localDiffs => new PatchDiffCollection(localDiffs))
      .then(this.renderLocalDiffs.bind(this))
      .catch(err => console.error(err.stack || err));
  },
  renderLocalDiffs: function (localDiffs) {
    var template = require('../templates/changes_list.html')
      , diffTypes = localDiffs.asDescription()
      , localData = this.collection.datasets.local
      , remoteData = this.collection.datasets.remote

    diffTypes.periodCollection.add.forEach(function (cid) {
    });

    var periodEdits = _.map(diffTypes.period.edit, function (periods, periodCollectionID) {
      var path = '/periodCollections/' + periodCollectionID
        , source = pointer.get(localData, path + '/source')
        , source = new Source(_.omit(source, 'id'), { parse: true })
        , template = require('../templates/changes/period_edit.html')
        , html

      html = _.map(periods, function (patchIDs, periodID) {
        var template = require('../templates/changes/change_row.html')
          , periodPath = path + '/definitions/' + periodID
          , diffHTML

        // Can't just compare to the remote -- need to apply the patches that
        // will be applied.
        diffHTML = periodDiff(
          pointer.get(remoteData, periodPath),
          pointer.get(localData, periodPath))

        return template({ diffHTML, patchIDs })
      }, this);

      return template({ diffs: html.join('\n'), source: source })
    }, this);

    var periodAdditions = diffTypes.period.add.map(function (cid) {
      var thisPatch = this.collection.get(cid).toJSON()
        , parsed = patchUtils.parsePatchPath(thisPatch.path) 
        , path = '/periodCollections/' + parsed.collection_id
        , source = pointer.get(localData, path + '/source')
        , source = new Source(_.omit(source, 'id'), { parse: true })
        , template = require('../templates/changes/period_edit.html')
        , html


      html = (function () {
        var template = require('../templates/changes/change_row.html')
          , periodPath = path + '/definitions/' + parsed.id
          , diffHTML

        // Can't just compare to the remote -- need to apply the patches that
        // will be applied.
        diffHTML = periodDiff({}, pointer.get(localData, periodPath));

        return template({ diffHTML, patchIDs: [cid] })
      })()

      return template({ diffs: html, source: source })
    }, this);

    this.$el.append(template({
      diffs: localDiffs,
      remoteData: this.collection.datasets.to,
      periodEdits: periodEdits,
      periodAdditions: periodAdditions
    }));
  }
});
