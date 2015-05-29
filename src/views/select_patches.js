"use strict";

var _ = require('underscore')
  , Backbone = require('backbone')
  , Immutable = require('immutable')
  , changeListTemplate = require('../templates/change_list')

/*
 * This view presents a list of patches to be selected along with a "continue"
 * button that, when pressed, will trigger a patchesSelected event with a list
 * of patches.
 */
module.exports = Backbone.View.extend({
  events: {
    'change .select-all-patches': 'handleSelectAll',
    'change .select-patch input': 'handleSelectPatch',
    'click #js-accept-patches': 'handleContinue',
  },
  initialize: function (opts) {
    this.patches = opts.patches;
    this.datasets = { from: opts.fromState, to: opts.toState };
    this.noChangeMessage = opts.noChangeMessage || 'No changes detected.';
    this.render();
  },
  render: function () {
    var html = changeListTemplate(this.patches, this.datasets)

    if (!html) {
      html = `<p>${this.noChangeMessage}</p>`
    } else {
      html += `
        <hr/>
        <button id="js-accept-patches" class="btn btn-default" disabled>Continue</button>
      `
    }

    this.$el.html(html);
    this.$continueButton = this.$('#js-accept-patches')
  },
  getSelectedPatches: function () {
    var patches = this.$('.select-patch input:checked')
      .toArray()
      .map(el => el.dataset.patches)
      .map(JSON.parse)
    return Immutable.fromJS(_.flatten(patches)).map(patch => patch.delete('fake'));
  },
  handleContinue: function () {
    this.trigger('selectedPatches', this.getSelectedPatches());
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
  }
});
