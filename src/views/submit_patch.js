"use strict";

var _ = require('underscore')
  , $ = require('jquery')
  , Backbone = require('../backbone')
  , patch = require('fast-json-patch')
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
      .then(remoteData =>
        this.collection = PatchDiffCollection.fromDatasets(this.localData.data, remoteData))
      .then(diffs => diffs.filterByHash('local'))
      .then(localDiffs => new PatchDiffCollection(localDiffs))
      .then(this.renderLocalDiffs.bind(this))
      .catch(err => console.error(err.stack || err));
  },
  renderLocalDiffs: function (localDiffs) {
    var template = require('../templates/changes_list.html')
      , diffTypes = localDiffs.asDescription()
      , localData = this.collection.datasets.from
      , remoteData = this.collection.datasets.to

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

    this.$el.append(template({
      diffs: localDiffs,
      remoteData: this.collection.datasets.to,
      periodEdits: periodEdits
    }));
  }
});
