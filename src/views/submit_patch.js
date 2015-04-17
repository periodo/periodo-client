"use strict";

var _ = require('underscore')
  , url = require('url')
  , Backbone = require('../backbone')
  , patchUtils = require('../utils/patch')
  , pointer = require('json-pointer')
  , jsonpatch = require('fast-json-patch')
  , periodDiff = require('../utils/period_diff')
  , Source = require('../models/source')
  , PatchDiffCollection = require('../collections/patch_diff')

function addLocalPatch(id) {
  var db = require('../db');
  return db(localStorage.currentBackend).localPatches
    .put({ id: id, resolved: false })
    .then(() => id);
}

module.exports = Backbone.View.extend({
  events: {
    'click #js-find-changes': 'findChanges',
    'click #js-accept-patches': 'handleContinue',
    'click #js-submit-patches': 'handleSubmit',
    'click #js-download-patch': 'handleDownloadPatch',
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
      this.$continueButton.prop('disabled', null);
    } else {
      $td.removeClass('patch-selected');
      if (!document.querySelector('.patch-selected')) {
        this.$continueButton.prop('disabled', 'disabled');
      }
    }
  },
  handleContinue: function () {
    var [patches, cids] = this.getSelectedPatches();


    this.renderConfirmPatches(cids, patches);
  },
  renderConfirmPatches: function (cids, patches) {
    var patchHTML = this.makeDiffHTML(patches)
      , template = require('../templates/confirm_patch.html')

    this.$el.html(template());
    this.$('#js-patch-list').html(patchHTML);
    this.$('#js-patch-list').find('td:first-child, .select-patch-header').remove();
    this.$('#js-accept-patches').remove();

    patches = patches.toJSON();
    patches.forEach(p => {
      if (p.hasOwnProperty('fake')) delete p.fake;
    });

    this.selectedPatch = { cids: cids, patches: patches }
  },
  handleDownloadPatch: function () {
    var saveAs = require('filesaver.js')
      , filename = 'periodo-' + (new Date().toISOString().split('T')[0]) + '.jsonpatch'
      , blob

    blob = new Blob(
      [JSON.stringify(this.selectedPatch.patches, false, '  ')],
      { type: 'application/json-patch+json' }
    )

    saveAs(blob, filename);
  },

  handleSubmit: function () {
    this.submitPatch(this.selectedPatch.cids, this.selectedPatch.patches);
  },
  getSelectedPatches: function () {
    var reduced = this.$('.select-patch input:checked').toArray().reduce((acc, el) => {
      var cids = el.dataset.patchIds.split(',');
      acc[0].push(this.collection.filter(patch => cids.indexOf(patch.cid) !== -1));
      acc[1].push(cids);
      return acc;
    }, [[], []]);

    var patches = _.flatten(reduced[0]);
    patches = new PatchDiffCollection(patches);

    var cids = _.flatten(reduced[1]);

    return [patches, cids];
  },
  submitPatch: function (cids, patches) {
    var ajax = require('../ajax')
      , ajaxOpts

    ajaxOpts = {
      url: url.resolve(window.location.href, '/d.jsonld'),
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(patches),
      headers: {
        Authorization: 'Bearer ' + JSON.parse(localStorage.auth).token
      }
    }

    return ajax.ajax(ajaxOpts).catch(this.handlePatchSubmitError)
      .then(([data, textStatus, xhr]) => addLocalPatch(xhr.getResponseHeader('Location')))
      .then(() => this.collection.remove(cids))
      .then(this.renderLocalDiffs.bind(this)) // TODO: Add "patch added" or "patch rejected method"
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
      .then(([remoteData]) => this.collection = PatchDiffCollection.fromDatasets({
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
  makeDiffHTML: function (patchCollection) {
    var template = require('../templates/changes_list.html')
      , localData = this.collection.datasets.local
      , remoteData = this.collection.datasets.remote
      , diffTypes

    if (!patchCollection) patchCollection = this.collection;
    diffTypes = patchCollection.asDescription()

    this.$('#js-patch-list').html('');

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
        var thisPatch = patchCollection.get(cid).toJSON()
          , parsed = patchUtils.parsePatchPath(thisPatch.path)
          , path = '/periodCollections/' + parsed.collection_id
          , source = pointer.get(localData, path + '/source')

        return formatPeriodRow(source, html);
      }

      return html;
    }, '');

    return template({
      diffs: patchCollection,
      periodEdits: periodEditHTML,
      periodAdditions: periodAdditionHTML
    });
  },
  renderLocalDiffs: function () {
    this.$('#js-patch-list').html(this.makeDiffHTML());
    this.$continueButton = this.$('#js-accept-patches')
      .text('Continue')
      .removeClass('btn-primary')
      .addClass('btn-default')
      .prop('disabled', 'disabled');
  }
});
