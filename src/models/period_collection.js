"use strict";

var _ = require('underscore')
  , Backbone = require('../backbone')
  , Period = require('../models/period')
  , PeriodCollection = require('../collections/period')
  , Source = require('../models/source')
  , Supermodel = require('supermodel')
  , Periodization

Periodization = Supermodel.Model.extend({
  skolemID: true,
  parse: function (data, options) {
    options = options || {};
    if (_.isObject(data.definitions)) {
      if (options.noMutate) data = JSON.parse(JSON.stringify(data));
      data.definitions = _.values(data.definitions);
    }
    return Supermodel.Model.prototype.parse(data, options);
  },
  getTimespan: function () {
    var starts = this.definitions()
      .map(function (period) { return period.start() })
      .filter(function (t) { return t.hasYearData() })

    var stops = this.definitions()
      .map(function (period) { return period.stop() })
      .filter(function (t) { return t.hasYearData() })

    function intYear(min, terminus) {
      var year = terminus.get('year') || terminus.get(min ? 'earliestYear' : 'latestYear');
      return parseInt(year, 10)
    }

    return {
      lower: starts.length ? _.min(starts, function (t) { return t.getEarliestYear() }) : undefined,
      upper: starts.length ? _.max(stops, function (t) { return t.getLatestYear() }) : undefined,
    }
  },
  toJSON: function () {
    // change to structure of dataset
    var ret = Supermodel.Model.prototype.toJSON.call(this);
    delete ret.source_id;
    ret.definitions = this.definitions().reduce(function (acc, period) {
      acc[period.id] = period.toJSON();
      return acc;
    }, {});
    ret.source = this.source().toJSON();
    ret.type = 'PeriodCollection';
    return ret;
  }
});

Periodization.has().many('definitions', {
  collection: PeriodCollection,
  inverse: 'periodization',
  source: 'definitions'
});

Periodization.has().one('source', {
  model: Source,
  inverse: 'periodization',
  source: 'source'
});

module.exports = Periodization;
