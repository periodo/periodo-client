"use strict";

var _ = require('underscore')
  , url = require('url')
  , Backbone = require('../backbone')
  , patchUtils = require('../utils/patch')
  , pointer = require('json-pointer')
  , jsonpatch = require('fast-json-patch')
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
    'click #js-find-changes': 'findChanges',
    'change .select-all-patches': 'handleSelectAll',
    'change .select-patch input': 'handleSelectPatch'
  },
  initialize: function ({ localData }) {
    this.localData = localData;
    this.render();
  },
  render: function () {
    var template = require('../templates/submit_patch.html');
    this.$el.html(template());
  },
  handleSelectAll: function (e) {
    var $checkbox = this.$(e.currentTarget)
      , $toToggle = $checkbox.closest('.patch-collection').find('.select-patch input')

    if ($checkbox.is(':checked')) {
      $toToggle.prop('checked', true).trigger('change');
    } else {
      $toToggle.prop('checked', false).trigger('change');
    }
  },
  handleSelectPatch: function (e) {
    var $checkbox = this.$(e.currentTarget)
      , $td = $checkbox.closest('td')

    if ($checkbox.is(':checked')) {
      $td.addClass('patch-selected');
    } else {
      $td.removeClass('patch-selected');
    }
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
  makePeriodDiffHTML: function(oldPeriod, patchIDs) {
    var template = require('../templates/changes/change_row.html')
      , regex = /.*?\/definitions\//
      , newPeriod
      , patches

    patches = this.collection
      .filter(patch => patchIDs.indexOf(patch.cid) !== -1)
      .map(patch => {
        var p = patch.toJSON();
        p.path = pointer.compile(pointer.parse(p.path).slice(4));
        return p;
      });

    newPeriod = JSON.parse(JSON.stringify(oldPeriod));
    jsonpatch.apply(newPeriod, patches);

    return template({
      diffHTML: periodDiff(oldPeriod, newPeriod),
      patchIDs: patchIDs
    });
  },
  renderLocalDiffs: function () {
    var template = require('../templates/changes_list.html')
      , diffTypes = this.collection.asDescription()
      , localData = this.collection.datasets.local
      , remoteData = this.collection.datasets.remote



    diffTypes.periodCollection.add.forEach(function (cid) {
    });

    function formatPeriodRow(source, periodHTML) {
      var template = require('../templates/changes/period_edit.html');
      source = new Source(_.omit(source, 'id'), { parse: true })
      return template({ diffs: periodHTML, source: source });
    }

    var periodEditHTML = _.map(diffTypes.period.edit, (periods, periodCollectionID) => {
      var path = '/periodCollections/' + periodCollectionID
        , source = pointer.get(localData, path + '/source')
        , html

      html = _.map(periods, (patchIDs, periodID) => {
        var periodPath = path + '/definitions/' + periodID
          , oldPeriod = pointer.get(remoteData, periodPath)

        return this.makePeriodDiffHTML(oldPeriod, patchIDs);
      }).join('\n');

      return formatPeriodRow(source, html);
    }).join('\n');


    var periodAdditionHTML = diffTypes.period.add.reduce((html, cid, idx, arr) => {
      html += this.makePeriodDiffHTML({}, [cid]);

      if (idx + 1 === arr.length) {
        var thisPatch = this.collection.get(cid).toJSON()
          , parsed = patchUtils.parsePatchPath(thisPatch.path)
          , path = '/periodCollections/' + parsed.collection_id
          , source = pointer.get(localData, path + '/source')

        return formatPeriodRow(source, html);
      }

      return html;
    }, '');


    this.$el.append(template({
      diffs: this.collection,
      remoteData: this.collection.datasets.to,
      periodEdits: periodEditHTML,
      periodAdditions: periodAdditionHTML
    }));
  }
});
