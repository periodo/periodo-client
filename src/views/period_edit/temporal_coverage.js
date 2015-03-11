"use strict";

var Backbone = require('../../backbone')
  , dateParser = require('../../utils/date_parser')

function parseDate(input) {
  try {
    return dateParser.parse(input);
  } catch (e) {
    return null;
  }

}

function formatMessage(json) {
  if (json._type === 'present') return 'present';
  if (!json.hasOwnProperty('in')) return '??????';
  if (json.in.hasOwnProperty('year')) return 'year ' + parseInt(json.in.year, 10);
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

function makeBinding(model, terminusLabel) {
  var terminus = model[terminusLabel]()
    , autoparse = model.isNew() || terminus.isGeneratedFromParser();

  return {
    observe: 'null',
    initialize: function ($el) { if ($el.val()) $el.trigger('input') },
    set: function (binding, value) { terminus.set(value); },
    onGet: function () { return terminus.get('label') },
    getVal: function ($el) {
      var label = $el.val()
        , parsed

      if (autoparse) {
        parsed = parseDate(label);
        setDateMessage($el, parsed, this);
      } else {
        // Handle dates not parsed automatically
      }

      if (terminusLabel === 'start') this.$('#js-endDate').trigger('input');

      return parsed;
    }
  }
}

module.exports = Backbone.View.extend({
  initialize: function () {
    this.render();
    this.addBinding(null, '#js-startDate', makeBinding(this.model, 'start'));
    this.addBinding(null, '#js-endDate', makeBinding(this.model, 'stop'));
    this.stickit();
  },
  render: function () {
    var template = require('./templates/temporal_coverage_form.html');
    this.$el.html(template());
  }
});
