"use strict";

var _ = require('underscore')
  , Backbone = require('../../backbone')
  , SpatialCoverageEditView = require('./spatial_coverage')
  , TemporalCoverageEditView = require('./temporal_coverage')
  , GeneralEditView = require('./general')
  , bindings

bindings = {
  period: {
    '#js-note': 'note',
    '#js-editorial-note': 'editorialNote',
  }
}

module.exports = Backbone.View.extend({
  bindings: _.extend({}, bindings.period),
  events: {
    'change #js-detect-dateType': 'updateDetectDateType',
    'change #js-dateType': function () {
      if (!this.autodetectDate) {
        this.$('#js-startDate, #js-endDate').trigger('input');
      }
    }
  },
  initialize: function () {
    this.render();
    this.stickit();
    this.subviews = {};

    this.subviews.spatialCoverage = new SpatialCoverageEditView({
      model: this.model,
      collection: this.model.spatialCoverage(),
      el: this.$('#js-spatial-coverage-container')
    });

    this.subviews.general = new GeneralEditView({
      model: this.model,
      el: this.$('#js-period-general-container')
    });

    this.subviews.temporalCoverage = new TemporalCoverageEditView({
      model: this.model,
      el: this.$('#js-temporal-coverage-container')
    });

    this.listenTo(this.model, 'invalid', function (model, errors) {
      this.$('.error-message').remove();
      for (var field in errors) {
        this.appendErrors(field, errors[field]);
      }
    });
  },
  render: function () {
    var template = require('./templates/period_form.html');
    this.$el.html(template({ isNew: this.model.isNew() }));
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
  updateDetectDateType: function () {
    this.autodetectDate = this.$('#js-detect-dateType').prop('checked');
    this.$('#js-dateType').prop('disabled', this.autodetectDate);
  },
  save: function () {
    this.model.validate();
  }
});
