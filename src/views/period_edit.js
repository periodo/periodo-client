"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , Period = require('../models/period')
  , dateParser = require('../utils/date_parser')
  , SpatialCoverageView = require('./spatial_coverage')
  , bindings

function parseDate(input, type) {
  try {
    return dateParser.parse(input);
  } catch (e) {
    return null;
  }

}

function formatMessage(json) {
  if (json._type === 'present') {
    return 'present';
  }

  if (!json.hasOwnProperty('in')) {
    return '??????';
  }

  if (json.in.hasOwnProperty('year')) {
    return 'year ' + parseInt(json.in.year, 10);
  }

  return 'range from ' + parseInt(json.in.earliestYear) + ' to ' + parseInt(json.in.latestYear);
}

function setDateMessage($el, parsed, view) {
  var $msgEl = $el.next('div');

  if (!$el.val()) {
    $msgEl.text('')
  } else if (parsed) {
    $msgEl.text('Parsed as ' + formatMessage(parsed));
  } else {
    if (view.model.get('dateType')) {
      $msgEl.text('Could not detect date in ' + view.model.get('dateType') + ' format.');
    } else if (view.autodetectDate) {
      $msgEl.text('Could not detect date.');
    } else {
      $msgEl.text('Date type must be set');
    }
  }
}

bindings = {
  period: {
    '#js-label': 'label',
    '#js-spatialCoverageLabel': 'spatialCoverageDescription',
    '#js-note': 'note',
    '#js-source-note': 'sourceNote',
    '#js-startDate': {
      observe: 'start',
      initialize: function ($el, model, options) {
        this.parseStart = this.model.isNew() || this.model.get('start').isGeneratedFromParser();
        if ($el.val()) $el.trigger('input');
      },
      onGet: function (value) { return value.get('label') },
      getVal: function ($el) {
        var label = $el.val(), parsed;

        if (this.parseStart) {
          parsed = parseDate(label)
          setDateMessage($el, parsed, this);
        } else {
          // Handle dates not parsed automatically
        }

        this.$('#js-endDate').trigger('input');
        return parsed;
      }
    },
    '#js-endDate': {
      observe: 'stop',
      initialize: function ($el) {
        this.parseStop = this.model.isNew() || this.model.get('stop').isGeneratedFromParser();
        if ($el.val()) $el.trigger('input');
      },
      onGet: function (value) { return value.get('label') },
      getVal: function ($el, event, options) {
        var label = $el.val(), parsed;

        if (this.parseStop) {
          parsed = parseDate(label)
          setDateMessage($el, parsed, this);
        }

        return parsed;
      }
    }
  }
}

module.exports = Backbone.View.extend({
  model: Period,
  bindings: _.extend({}, bindings.period),
  events: {
    'change #js-detect-dateType': 'updateDetectDateType',
    'change #js-dateType': function () {
      if (!this.autodetectDate) {
        this.$('#js-startDate, #js-endDate').trigger('input');
      }
    }
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
  initialize: function () {
    var spatialCoverageView

    this.render();
    this.stickit();

    //this.updateDetectDateType();

    spatialCoverageView = new SpatialCoverageView({
      collection: this.model.get('spatialCoverage'),
      el: this.$('#js-spatial-coverage-container')
    });

    this.listenTo(this.model, 'invalid', function (model, errors) {
      this.$('.error-message').remove();
      for (var field in errors) {
        this.appendErrors(field, errors[field]);
      }
    });
  },
  updateDetectDateType: function () {
    this.autodetectDate = this.$('#js-detect-dateType').prop('checked');
    this.$('#js-dateType').prop('disabled', this.autodetectDate);
  },
  render: function () {
    var template = require('../templates/period_form.html');
    this.$el.html(template());
    this.$el.prepend('<h3>' + (this.model.isNew() ? 'Add' : 'Edit') + ' period</h3>');
  },
  save: function () {
    this.model.validate();
  }
});
