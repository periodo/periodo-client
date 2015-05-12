"use strict";

var _ = require('underscore')
  , Immutable = require('immutable')
  , Backbone = require('../../backbone')
  , LanguageFormView = require('./language')
  , SpatialCoverageView = require('./spatial_coverage')
  , TemporalCoverageView = require('./temporal_coverage')

// When the cursor is changed, any changes will be committed and the view
// will be removed.

module.exports = Backbone.View.extend({
  initialize: function (opts) {
    this.store = opts.store;
    this.cursor = opts.cursor;
    this.subviews = {};

    this.render();

    this.subviews.spatialCoverage = new SpatialCoverageView({
      el: this.$('#js-spatial-coverage-container'),
      cursor: this.cursor,
      store: this.store
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
  validate: function () {
    var { validate } = require('../../helpers/period')
      , data = Immutable.fromJS(this.getData())
      , errors = validate(data)

    this.$('.error-message').remove();
    if (errors) {
      _.forEach(errors, (messages, label) => this.appendErrors(label, messages));
      return false;
    } else {
      return data;
    }
  },
  savePeriod: function () {
    var data = this.validate()

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
  appendErrors: function (label, messages) {
    var $container = this.$('[data-error-container=' + label + ']')
      , html
      , $label

    html = '<div class="error-message alert alert-danger"><ul class="list-unstyled">'
    html += messages.map(function (message) { return '<li>' + message + '</li>' });
    html += '</ul></li>'

    if (!$container.length) {
      this.$el.prepend(html);
    } else {
      $label = $container.find('label').first();
      if ($label.length) {
        $label.after(html);
      } else {
        $container.prepend(html);
      }
    }
  }
});
