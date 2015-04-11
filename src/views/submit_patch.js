"use strict";

var $ = require('jquery')
  , Backbone = require('../backbone')
  , patch = require('fast-json-patch')

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

    this.$el.append(template({
      diffs: localDiffs,
      remoteData: this.collection.datasets.to
    }));
  }
});
