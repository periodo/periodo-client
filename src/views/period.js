"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , Period = require('../models/period')
  , dateParser = require('../utils/date_parser')
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

bindings = {
  '#js-label': {
    observe: 'label',
    //setOptions: { validate: true }
  },
  '#js-source': {
    observe: 'source',
    //setOptions: { validate: true }
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
    observe: 'startDate',
    getVal: function ($el) {
      var val = $el.val()
        , parsed = parseDate(val)

      if (parsed) {
        this.model.set('dateType', parsed.type);
      } else {
        this.model.unset('dateType');
      }

      return this.model.has('dateType') && parsed.isoValue;
    }
  },
  '#js-endDate': {
    observe: 'endDate',
    getVal: function ($el) {
      var parsed = parseDate($el.val(), this.model.get('dateType'));
      return parsed && parsed.isoValue;
    }
  }
}

module.exports = Backbone.View.extend({
  model: Period,
  bindings: _.extend({}, bindings),
  events: {
    'click #js-save-period': 'save'
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
    this.render();
    this.stickit();

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


    var $monitor = Backbone.$('<pre>').appendTo(this.$el);
    $monitor.before('<h2>Output preview</h2>');
    this.listenTo(this.model, 'change', function () {
      $monitor.html(JSON.stringify(this.model, null, '  '));
    });

  },
  render: function () {
    var template = require('../templates/period_form.html');
    this.$el.html(template());
  },
  save: function () {
    this.model.validate();
  }
});
