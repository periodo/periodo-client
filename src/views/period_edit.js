"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , Period = require('../models/period')
  , dateParser = require('../utils/date_parser')
  , SpatialCoverageView = require('./spatial_coverage')
  , bindings

function parseDate(input, type) {
  var options = {};

  if (type) {
    if (type.match(/^bp/i)) {
      options.startRule = 'bpyear';
      options.bpBase = type.slice(2) || 2000;
    } else {
      options.startRule = type + 'year';
    }
  }

  try {
    return dateParser.parse(input, options);
  } catch (e) {
    return null;
  }

}

function setDateMessage($el, parsed, view) {
  var $msgEl = $el.next('div');

  if (!$el.val()) {
    $msgEl.text('')
  } else if (parsed) {
    $msgEl.text('Parsed as ISO year: ' + parsed.isoValue);
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
    '#js-note': 'note',
    '#js-dateType': {
      observe: 'dateType',
      selectOptions: {
        collection: function () { return this.model.dateTypes; },
        defaultOption: ' '
      }
    }
  },

  start: {
  '#js-startDate': {
      observe: ['label', 'year'],
      initialize: function ($el) {
        if ($el.val()) $el.trigger('input');
      },
      onGet: function (value) { return value[0] },
      getVal: function ($el) {
        var val = $el.val()
          , parsed

        if (this.autodetectDate) {
          parsed = parseDate(val)
        } else {
          parsed = this.model.has('dateType') ?
            parseDate(val, this.model.get('dateType'))
            : null;
        }

        if (parsed) {
          if (this.autodetectDate) this.model.set('dateType', parsed.type);
        } else {
          if (this.autodetectDate) this.model.unset('dateType');
        }

        setDateMessage($el, parsed, this);
        this.$('#js-endDate').trigger('input');

        return parsed ? [ parsed.label, parsed.isoValue ] : [ null, null ];
      }
    }
  },

  stop: {
    '#js-endDate': {
      observe: ['label', 'year'],
      initialize: function ($el) {
        if ($el.val()) $el.trigger('input');
      },
      onGet: function (value) { return value[0] },
      getVal: function ($el) {
        var parsed = this.model.has('dateType') ?
          parseDate($el.val(), this.model.get('dateType'))
          : null;

        setDateMessage($el, parsed, this);

        return parsed ? [ parsed.label, parsed.isoValue ] : [ null, null ];
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
    this.updateDetectDateType();
    this.stickit();
    this.stickit(this.model.get('start'), bindings.start);
    this.stickit(this.model.get('stop'), bindings.stop);

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
