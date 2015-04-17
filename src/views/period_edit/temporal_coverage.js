"use strict";

var $ = require('jquery')
  , _ = require('underscore')
  , Backbone = require('../../backbone')
  , dateParser = require('../../utils/date_parser')

function parseDate(input) {
  try {
    return dateParser.parse(input);
  } catch (e) {
    return null;
  }

}

function makeBinding(model, terminusLabel, $autoparse) {
  var terminus = model[terminusLabel]()
    , autoparse = $autoparse.prop('checked')

  function refresh($el, val, opts) {
    var label = val && val.label
      , date = val && val.in
      , $container

    opts = opts || {};

    if (opts.updateLabel) {
      $el.find('.label-input').val(label);
    }

    if (!val || !date || _.isEmpty(date)) {
      $el.find('[class*="year-input"]').val('');
      return;
    }

    if (date.hasOwnProperty('year')) {
      $el.find('.date-single-year')
        .removeClass('hide')
        .find('.year-input')
        .val(date.year);
      $el.find('.date-multi-year').addClass('hide');
    } else {
      $container = $el.find('.date-multi-year').removeClass('hide');
      $container.find('.earliest-year-input').val(date.earliestYear);
      $container.find('.latest-year-input').val(date.latestYear);
      $el.find('.date-single-year').addClass('hide');
    }
  }

  function refreshAutoparse($el) {
    if (autoparse) {
      $el.find('[class*="year-input"]').prop('disabled', 'disabled');
      $el.find('.toggle-year-parts').addClass('hide');
      $el.trigger('input');
    } else {
      $el.find('[class*="year-input"]').prop('disabled', null);
      $el.find('.toggle-year-parts').removeClass('hide');
    }
  }

  return {
    observe: 'null',
    events: ['input'],
    initialize: function ($el) {
      refreshAutoparse($el);
      $el.find('.toggle-year-parts').on('click', function () {
        $el.find('.date-multi-year, .date-single-year').toggleClass('hide');
      });
      $autoparse.on('change', function (e) {
        autoparse = $autoparse.prop('checked');
        refreshAutoparse($el);
      });
    },
    destroy: function ($el) {
      $el.find('.toggle-year-parts').off('click');
      $autoparse.off('change');
    },
    set: function (binding, value) {
      terminus.set(value);
    },
    onGet: function () {
      return terminus.toJSON();
    },
    update: function($el, val, model, options) {
      refresh($el, val, { updateLabel: true });
    },
    updateModel: true,
    getVal: function ($el) {
      var label = $el.find('.label-input').val()
        , data

      if (autoparse) {
        data = parseDate(label);
        refresh($el, data);
      } else {
        data = { label: label, in: {}}
        if ($el.find('.date-single-year').is(':visible')) {
          data.in.year = $el.find('.year-input').val();
        } else {
          data.in.earliestYear = $el.find('.earlist-year-input').val();
          data.in.latestYear = $el.find('.latest-year-input').val();
        }
      }

      return data;
    }
  }
}

function autoparseTerminus(terminus) {
  var empty = !terminus.has('in') || _.isEmpty(terminus.get('in'));
  if (empty) {
    if (!terminus.get('label')) {
      return true;
    } else {
      return !!parseDate(terminus.get('label'));
    }
  } else {
    return terminus.isGeneratedFromParser();
  }
}

module.exports = Backbone.View.extend({
  initialize: function () {
    var autoparseStart = autoparseTerminus(this.model.start())
      , autoparseStop = autoparseTerminus(this.model.stop())
      , $autoparse

    this.render();

    $autoparse = this.$('#js-autoparse-dates')

    if (autoparseStart && autoparseStop) {
      $autoparse.prop('checked', 'checked')
    }

    this.addBinding(null, '.date-input-start', makeBinding(this.model, 'start', $autoparse));
    this.addBinding(null, '.date-input-stop', makeBinding(this.model, 'stop', $autoparse));
    this.stickit();
  },
  render: function () {
    var template = require('./templates/temporal_coverage_form.html');
    this.$el.html(template());
  }
});
