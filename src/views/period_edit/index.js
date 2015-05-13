"use strict";

var _ = require('underscore')
  , Backbone = require('../../backbone')
  , LanguageFormView = require('./language')
  , SpatialCoverageView = require('./spatial_coverage')
  , TemporalCoverageView = require('./temporal_coverage')
  , PeriodEditView

// When the cursor is changed, any changes will be committed and the view
// will be removed.

PeriodEditView = Backbone.View.extend({
  initialize: function (opts) {
    this.cursor = opts.cursor;
    this.subviews = {};

    this.render();

    this.subviews.spatialCoverage = new SpatialCoverageView({
      el: this.$('#js-spatial-coverage-container'),
      cursor: this.cursor,
      spatialCoverages: opts.spatialCoverages
    });

    this.subviews.temporalCoverage = new TemporalCoverageView({
      el: this.$('#js-temporal-coverage-container'),
      cursor: this.cursor
    });

    this.subviews.language = new LanguageFormView({
      el: this.$('#js-language-form'),
      cursor: this.cursor
    });
  },
  render: function () {
    var template = require('./templates/form.html');
    this.$el.html(template({ data: this.cursor.toJS() }));
  },
  remove: function () {
    _.forEach(this.subviews, view => view.remove());
  },
  getData: function () {
    var data = {}
      , note = this.$('#js-note').val().trim()
      , editorialNote = this.$('#js-editorial-note').val().trim()

    if (note.length) data.note = note;
    if (editorialNote.length) data.editorialNote = editorialNote;

    return _.extend(
      this.subviews.language.getData(),
      this.subviews.spatialCoverage.getData(),
      this.subviews.temporalCoverage.getData(),
      { type: 'PeriodDefinition' },
      data)
  },
  validator: require('../../helpers/period').validate,
  savePeriod: function () {
    var [errors, data] = this.validate()

    if (data) {
      this.cursor = this.cursor.update(() => data);
    }
  },
  cancelPeriod: function () {
    // Trigger an update without doing anything
    this.cursor = this.cursor.update(c => c);
  },
  deletePeriod: function () {
    this.cursor = this.cursor.update(() => undefined);
  },
});

_.defaults(PeriodEditView.prototype, require('../mixins/validate'));

module.exports = PeriodEditView;
