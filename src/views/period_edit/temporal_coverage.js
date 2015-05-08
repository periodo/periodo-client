"use strict";

var _ = require('underscore')
  , Backbone = require('../../backbone')
  , parseDate = require('../../utils/date_parser')


function shouldAutoparse(start, stop) {
  var wasAutoparsed = require('../../helpers/terminus').wasAutoparsed
  return (start && stop) && (wasAutoparsed(start) && wasAutoparsed(stop));
}


module.exports = Backbone.View.extend({
  events: {
    'input .js-terminus-label.js-autoparse': 'handleAutoparseInput',
    'click .js-toggle-year-parts': 'handleToggleYearParts',
    'change #js-autoparse-dates': 'handleAutoparseChange'
  },
  initialize: function () {
    this.render();
    this.$autoparse = this.$('#js-autoparse-dates');
    if (shouldAutoparse(this.model.get('start'), this.model.get('stop'))) {
      this.toggleAutoparse(true);
    }
  },
  render: function () {
    var template = require('./templates/temporal_coverage_form.html')
      , data = this.model.toJS()

    function isRange(terminus) {
      return terminus.hasOwnProperty('earliestYear') || terminus.hasOwnProperty('latestYear')
    }

    this.$el.html(template({
      start: { data: data.start, range: isRange(data.start) },
      stop: { data: data.stop, range: isRange(data.stop) }
    }));
  },
  toggleAutoparse: function (on) {
    var labelSelector = '.js-terminus-label'
      , disableSelectors = '[data-field="terminus-in"] input, .js-toggle-year-parts'

    if (on) {
      this.$autoparse.prop('checked', 'checked');
      this.$(labelSelector).addClass('js-autoparse');
      this.$(disableSelectors).prop('disabled', 'disabled');
      this.$('[data-terminus]').toArray().forEach(el => this.setAutoparseResult(el));
    } else {
      this.$autoparse.prop('checked', null);
      this.$(labelSelector).removeClass('js-autoparse');
      this.$(disableSelectors).prop('disabled', null);
    }
  },
  handleAutoparseInput: function (e) {
    var terminus = this.$(e.currentTarget).closest('[data-terminus]');
    this.setAutoparseResult(terminus[0]);
  },
  handleToggleYearParts: function (e) {
    this.$(e.currentTarget)
      .closest('[data-terminus]')
      .find('[data-field="terminus-in"]')
      .toggleClass('hide')
  },
  handleAutoparseChange: function (e) {
    this.toggleAutoparse(e.currentTarget.checked);
  },
  setAutoparseResult: function (terminusEl) {
    var label = terminusEl.querySelector('[data-field="label"]').value
      , parsed = parseDate(label)
      , qs = terminusEl.querySelector.bind(terminusEl)

    if (parsed) {
      if (parsed.in.year) {
        qs('.date-single-year').classList.remove('hide')
        qs('.date-multi-year').classList.add('hide')
        qs('[data-field="year"]').value = parsed.in.year;
      } else {
        qs('.date-single-year').classList.add('hide')
        qs('.date-multi-year').classList.remove('hide')
        qs('[data-field="earliestYear"]').value = parsed.in.earliestYear;
        qs('[data-field="latestYear"]').value = parsed.in.latestYear;
      }
    } else {
      _.forEach(terminusEl.querySelectorAll('[data-field="terminus-in"] input'), el => {
        el.value = '';
      });
    }
  },
  getData: function () {
    return this.$('[data-terminus]').toArray().reduce((acc, el) => {
      var val = {}
        , fields

      val.label = el.querySelector('[data-field="label"]').value;
      val.in = {};

      fields = el.querySelectorAll('[data-field="terminus-in"]:not(.hide) [data-field]');
      _.forEach(fields, fieldEl => {
        if (fieldEl.value) {
          val.in[fieldEl.dataset.field] = fieldEl.value;
        }
      });

      acc[el.dataset.terminus] = val;

      return acc;
    }, {});
  }
});
