"use strict";

var Backbone = require('../backbone')
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
  bindings: bindings,
  initialize: function () {
    this.render();
    this.stickit();

    var $monitor = Backbone.$('<div>').appendTo(this.$el);
    this.listenTo(this.model, 'change', function () {
      $monitor.html(JSON.stringify(this.model));
    });

  },
  render: function () {
    var template = require('../templates/period_form.html');
    this.$el.html(template());
  }
});
