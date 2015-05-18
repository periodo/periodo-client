"use strict";

var _ = require('underscore')
  , url = require('url')
  , Backbone = require('../backbone')
  , Immutable = require('immutable')
  , pointer = require('json-pointer')
  , jsonpatch = require('fast-json-patch')
  , periodDiff = require('../utils/period_diff')
  , PatchDiffCollection = require('../collections/patch_diff')


module.exports = Backbone.View.extend({
  events: {
    'click #js-find-changes': 'findChanges',
    'click #js-accept-patches': 'handleContinue',
    'click #js-submit-patches': 'handleSubmit',
    'click #js-download-patch': 'handleDownloadPatch',
    'change .select-all-patches': 'handleSelectAll',
    'change .select-patch input': 'handleSelectPatch'
  },
  initialize: function (opts) {
    opts = opts || {};
    this.backend = opts.backend || require('../backends').current()
    this.localData = opts.localData;
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
  handleSubmit: function () {
    var ajax = require('../ajax')
      , cids = this.selectedPatch.cids
      , patches = this.selectedPatch.patches
      , ajaxOpts

    ajaxOpts = {
      url: url.resolve(window.location.href, '/d.jsonld'),
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(patches),
      headers: {
      }
    }

    if (localStorage.auth) {
      ajaxOpts.headers.Authorization = 'Bearer ' + JSON.parse(localStorage.auth).token;
    }

    require('../app').trigger('request');

    return ajax.ajax(ajaxOpts).catch(this.handlePatchSubmitError)
      .then(([data, textStatus, xhr]) => {
        var patchURI = xhr.getResponseHeader('Location');
        return this.addLocalPatch(patchURI, patches);
      })
      .then(() => this.collection.remove(cids))
      .then(this.render.bind(this)) // TODO: Add "patch added" or "patch rejected" message
      .catch(err => require('../app').handleError(err))
  },
  addLocalPatch: function(id, patches) {
    var db = require('../db');

    return db(this.backend.name).localPatches
      .put({ id: id, resolved: false, data: patches, submitted: new Date() })
      .then(() => id);
  },
  handlePatchSubmitError: function ([xhr, textStatus, errorThrown]) {
    var errorMessages
      , msg

    errorMessages = {
      0: 'Connection error- could not connect to server.',
      400: 'Bad patch format.',
      401: 'Unauthorized to send patch. Login and try again.'
    }

    msg = errorMessages[xhr.status];

    alert(msg);

    this.addError(msg);

    // TODO: If authentication error...
 
    // TODO: If bad patch error...
 
    // TODO: If another error...
  },
  findChanges: function () {
    var ajax = require('../ajax')
      , url = this.$('input').val()
      , PatchDiffCollection = require('../collections/patch_diff')

    require('../app').trigger('request');
    ajax.getJSON(url + '/d/')
      .then(([remoteData]) => this.collection = PatchDiffCollection.fromDatasets({
        local: this.localData.data,
        remote: remoteData,
        to: 'remote'
      }))
      .then(patches => patches.filterByHash())
      .then(patches => {
        this.renderLocalDiffs(patches);
        this.patches = patches;
      })
      .then(() => require('../app').trigger('requestEnd'))
      .catch(err => require('../app').handleError(err))
  },
  makePeriodDiffHTML: function(oldPeriod, patches) {
    var template = require('../templates/changes/change_row.html')
      , truncatedPatches
      , newPeriod

    function truncatePath(path) { return pointer.compile(pointer.parse(path).slice(4)) }
    truncatedPatches = patches.map(patch => patch.update('path', truncatePath)).toJSON();
    
    newPeriod = JSON.parse(JSON.stringify(oldPeriod));
    jsonpatch.apply(newPeriod, truncatedPatches);

    return template({
      patches: patches,
      diffHTML: periodDiff(oldPeriod, newPeriod)
    })
  },
  makeDiffHTML: function (patches) {
    var { groupByChangeType } = require('../helpers/patch_collection')
      , template = require('../templates/changes_list.html')
      , localData = this.collection.datasets.local
      , remoteData = this.collection.datasets.remote
      , groupedPatches

    // if (!patchCollection) patchCollection = this.collection;
    groupedPatches = groupByChangeType(patches)

    this.$('#js-patch-list').html('');

    /*
    diffTypes.periodCollection.add.forEach(function (cid) {
    });
    */

    function formatPeriodRow(source, periodHTML) {
      var template = require('../templates/changes/period_edit.html')
        , { getDisplayTitle } = require('../helpers/source')
        , title = getDisplayTitle(Immutable.fromJS(source))

      return template({ diffs: periodHTML, source: title });
    }

    var periodEditHTML = groupedPatches
      .getIn(['period', 'edit'] || [])
      .map((periods, collectionID) => {
        var path = '/periodCollections/' + collectionID
          , source = pointer.get(localData, path + '/source')
          , html

        html = periods.map((patches, periodID) => {
          var periodPath = path + '/definitions/' + periodID
            , oldPeriod = pointer.get(remoteData, periodPath)

          return this.makePeriodDiffHTML(oldPeriod, patches);
        }).join('\n');

        return formatPeriodRow(source, html);
      }).join('\n');


    /*
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
    */

    return template({
      diffs: groupedPatches.toJS(),
      periodEdits: periodEditHTML,
      //periodAdditions: periodAdditionHTML
    });
  },
  renderLocalDiffs: function (diffs) {
    this.$('#js-patch-list').html(this.makeDiffHTML(diffs));
    this.$continueButton = this.$('#js-accept-patches')
      .text('Continue')
      .removeClass('btn-primary')
      .addClass('btn-default')
      .prop('disabled', 'disabled');
  }
});
