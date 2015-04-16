"use strict";

var _ = require('underscore')
  , url = require('url')
  , Backbone = require('../backbone')
  , patchUtils = require('../utils/patch')
  , pointer = require('json-pointer')
  , periodDiff = require('../utils/period_diff')
  , Source = require('../models/source')

function addLocalPatch(id) {
  var db = require('../db');
  return db.localPatches
    .put({ id: id, resolved: false })
    .then(() => id);
}

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
  submitPatch: function (cids, patches) {
    var ajax = require('../ajax')
      , ajaxOpts

    ajaxOpts = {
      url: url.resolve(window.location.href, '/d.jsonld'),
      method: 'PATCH',
      contentType: 'application/json',
      data: patches
    }

    return ajax.ajax(ajaxOpts).catch(this.handlePatchSubmitError)
      .then((data, textStatus, xhr) => addLocalPatch(xhr.getResponse('Location')))
      .then(() => this.collection.remove(cids))
      .then(this.renderLocalDiffs) // TODO: Add "patch added" or "patch rejected method"
  },
  handlePatchSubmitError: function (xhr, textStatus, errorThrown) {
    var msg = errorThrown;

    this.addError(msg);

    // TODO: If authentication error...
 
    // TODO: If bad patch error...
 
    // TODO: If another error...
  },
  findChanges: function () {
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
      .then(models => this.collection.reset(models))
      .then(this.renderLocalDiffs.bind(this))
      .catch(err => console.error(err.stack || err));
  },
  renderLocalDiffs: function () {
    var template = require('../templates/changes_list.html')
      , diffTypes = this.collection.asDescription()
      , localData = this.collection.datasets.local
      , remoteData = this.collection.datasets.remote

    diffTypes.periodCollection.add.forEach(function (cid) {
    });

    var periodEdits = _.map(diffTypes.period.edit, function (periods, periodCollectionID) {
      var path = '/periodCollections/' + periodCollectionID
        , source = pointer.get(localData, path + '/source')
        , template = require('../templates/changes/period_edit.html')
        , html

      source = new Source(_.omit(source, 'id'), { parse: true })
      html = _.map(periods, function (patchIDs, periodID) {
        var template = require('../templates/changes/change_row.html')
          , periodPath = path + '/definitions/' + periodID
          , diffHTML

        // Can't just compare to the remote -- need to apply the patches that
        // will be applied.
        diffHTML = periodDiff(
          pointer.get(remoteData, periodPath),
          pointer.get(localData, periodPath))

        return template({ diffHTML: diffHTML, patchIDs: patchIDs })
      }, this);

      return template({ diffs: html.join('\n'), source: source })
    }, this);

    var periodAdditions = diffTypes.period.add.map(function (cid) {
      var thisPatch = this.collection.get(cid).toJSON()
        , parsed = patchUtils.parsePatchPath(thisPatch.path) 
        , path = '/periodCollections/' + parsed.collection_id
        , source = pointer.get(localData, path + '/source')
        , template = require('../templates/changes/period_edit.html')
        , html


      source = new Source(_.omit(source, 'id'), { parse: true })
      html = (function () {
        var template = require('../templates/changes/change_row.html')
          , periodPath = path + '/definitions/' + parsed.id
          , diffHTML

        // Can't just compare to the remote -- need to apply the patches that
        // will be applied.
        diffHTML = periodDiff({}, pointer.get(localData, periodPath));

        return template({ diffHTML: diffHTML, patchIDs: [cid] })
      })()

      return template({ diffs: html, source: source })
    }, this);

    this.$el.append(template({
      diffs: this.collection,
      remoteData: this.collection.datasets.to,
      periodEdits: periodEdits,
      periodAdditions: periodAdditions
    }));
  }
});
