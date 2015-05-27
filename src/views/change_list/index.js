"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , Immutable = require('immutable')

module.exports = Backbone.View.extend({
  events: {
    'change .select-all-patches': 'handleSelectAll',
    'change .select-patch input': 'handleSelectPatch',
    'click #js-download-patch': 'handleDownloadPatch'
  },
  initialize: function (opts) {
    this.fromState = opts.fromState;
    this.toState = opts.toState;
    this.patches = opts.patches;

    this.noChangeMessage = opts.noChangeMessage || 'No change detected.';

    this.render();
  },
  render: function () {
    this.$el.html(this.makeDiffHTML(this.patches));
    this.$continueButton = this.$('#js-accept-patches')
      .text('Continue')
      .removeClass('btn-primary')
      .addClass('btn-default')
      .prop('disabled', 'disabled');
  },
  makeDiffHTML: function (patches) {
    var { groupByChangeType } = require('../../helpers/patch_collection')
      , groupedPatches = groupByChangeType(patches)
      , html = ''

    this.$('#js-patch-list').html('');

    /* Added period collections */
    if (groupedPatches.hasIn(['periodization', 'add'])) {
      let template = require('./templates/period_collection_add');
      html += template(groupedPatches.getIn(['periodization', 'add']));
    }

    if (groupedPatches.hasIn(['periodization', 'edit'])) {
      // FIXME
    }

    if (groupedPatches.hasIn(['period', 'add'])) {
      let template = require('./templates/period_add');
      html += template(groupedPatches.getIn(['period', 'add']), this.fromState, this.toState);
    }

    if (groupedPatches.hasIn(['period', 'edit'])) {
      let template = require('./templates/period_edit');
      html += template(groupedPatches.getIn(['period', 'edit']), this.fromState, this.toState);
    }


    if (!html) {
      html = `<p>${this.noChangeMessage}</p>`
    } else {
      html += `
        <hr/>
        <button id="js-accept-patches" class="btn btn-primary">Apply selected changes</button>
      `
    }

    return html;
  },
  getSelectedPatches: function () {
    var patches = this.$('.select-patch input:checked')
      .toArray()
      .map(el => el.dataset.patches)
      .map(JSON.parse)
    return Immutable.fromJS(_.flatten(patches));
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
  handleDownloadPatch: function () {
    var saveAs = require('filesaver.js')
      , filename = 'periodo-' + (new Date().toISOString().split('T')[0]) + '.jsonpatch'
      , blob

    blob = new Blob(
      [JSON.stringify(this.selectedPatch.patches, false, '  ')],
      { type: 'application/json-patch+json' }
    )

    saveAs(blob, filename);
  }
});
