"use strict";

var _ = require('underscore')
  , Backbone = require('../../backbone')
  , LanguageFormView = require('./language')
  , SpatialCoverageView = require('./spatial_coverage')
  , TemporalCoverageView = require('./temporal_coverage')


module.exports = Backbone.View.extend({
  initialize: function (opts) {
    opts = opts || {};
    this.store = opts.store;

    this.render();
    this.subviews = {};

    this.subviews.spatialCoverage = new SpatialCoverageView({
      el: this.$('#js-spatial-coverage-container'),
      model: this.model,
      store: this.store
    });

    this.subviews.temporalCoverage = new TemporalCoverageView({
      el: this.$('#js-temporal-coverage-container'),
      model: this.model
    });

    this.subviews.language = new LanguageFormView({
      el: this.$('#js-language-form'),
      model: this.model
    });
  },
  render: function () {
    var template = require('./templates/form.html');
    this.$el.html(template({ data: this.model.toJS() }));
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
      data)
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
  },
  save: function () {
    this.model.validate();
  }
});
