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
  '#js-label': {
    observe: 'label',
    //setOptions: { validate: true }
  },
  '#js-note': {
    observe: 'note'
  },
  '#js-dateType': {
    observe: 'dateType',
    //setOptions: { validate: true },
    selectOptions: {
      collection: function () { return this.model.dateTypes; },
      defaultOption: ' '
    }
  },
  '#js-startDate': {
    observe: 'startDateLabel',
    getVal: function ($el) {
      var val = $el.val()
        , dateType
        , parsed

      if (this.autodetectDate) {
        parsed = parseDate(val)
      } else {
        parsed = this.model.has('dateType') ? parseDate(val, this.model.get('dateType')) : null;
      }

      if (parsed) {
        if (this.autodetectDate) this.model.set('dateType', parsed.type);
        this.model.set('startDate', parsed.isoValue);
      } else {
        if (this.autodetectDate) this.model.unset('dateType');
        this.model.unset('startDate');
      }

      setDateMessage($el, parsed, this);
      this.$('#js-endDate').trigger('input');

      return parsed && parsed.value;
    }
  },
  '#js-endDate': {
    observe: 'endDateLabel',
    getVal: function ($el) {
      var parsed = this.model.has('dateType') ? parseDate($el.val(), this.model.get('dateType')) : null;
      if (parsed) {
        this.model.set('endDate', parsed.isoValue);
      } else {
        this.model.unset('endDate');
      }

      setDateMessage($el, parsed, this);

      return parsed && parsed.value;
    }
  }
}

module.exports = Backbone.View.extend({
  model: Period,
  bindings: _.extend({}, bindings),
  events: {
    'click #js-save-period': 'save',
    'change #js-detect-dateType': 'updateDetectDateType',
    'change #js-dateType': function () {
      if (!this.autodetectDate) {
        this.$('#js-startDate, #js-endDate').trigger('input');
      }
    }
  },
  appendError: function (label, message) {
    var $container = this.$('[data-error-container=' + label + ']')
      , html = '<div class="error-message alert alert-danger">' + message + '</div>'
      , $label

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

    spatialCoverageView = new SpatialCoverageView({
      collection: this.model.spatialCoverages,
      el: this.$('#js-spatial-coverage-container')
    });

    this.listenTo(this.model, 'validated:invalid', function (model, errors) {
      this.$('.error-message').remove();
      for (var field in errors) {
        this.appendError(field, errors[field]);
      }
    });

    this.listenTo(this.model, 'validated:valid', function () {
      this.$('.error-message').remove();
    });

    this.listenToOnce(this.model, 'validated:invalid', function () {
      this.unstickit();
      for (var binding in this.bindings) {
        if (!this.bindings[binding].setOptions) this.bindings[binding].setOptions = {};
        this.bindings[binding].setOptions.validate = true;
      }
      this.stickit();
    });


    this.listenTo(this.model, 'change', this.updateMonitor);
    this.listenTo(this.model.spatialCoverages, 'add remove', this.updateMonitor);
  },
  updateDetectDateType: function (e) {
    this.autodetectDate = this.$('#js-detect-dateType').prop('checked');
    this.$('#js-dateType').prop('disabled', this.autodetectDate);
  },
  updateMonitor: function () {
    if (!this.$monitor) this.$monitor = this.$('pre');
    this.$monitor.html(this.model.toJSONLD());
  },
  render: function () {
    var template = require('../templates/period_form.html');
    this.$el.html(template());

    Backbone.$('<pre>')
      .appendTo(this.$el)
      .before('<h2>Output preview</h2>');
  },
  save: function () {
    this.model.validate();
  }
});
