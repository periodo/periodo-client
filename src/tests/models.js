"use strict";

var assert = require('assert');

describe('Source model', function () {
  var Source = require('../models/source')

  it('should parse a source that is part of another source accurately', function () {
    var sampleData = require('./data/source-partof.json')
      , source = new Source(sampleData)

    assert.deepEqual(source.toJSON(), sampleData);
  });
});

describe('Period collection model', function () {
  var PeriodCollection = require('../models/period_collection')
    , sampleData = require('./data/period-collection.json')
    , periodCollection = new PeriodCollection(sampleData, { parse: true, noMutate: true })

  it('should work', function () {
    assert.deepEqual(periodCollection.toJSON(), require('./data/period-collection.json'))
  });

  it('should tell me upper and lower timespans', function () {
    var timespan = periodCollection.getTimespan();
    for (var key in timespan) {
      timespan[key] = timespan[key].toJSON();
    }
    assert.deepEqual(timespan, {
      lower: { "label": "800 B.C.", "in": { "year": "-0799" } },
      upper: { "label": "206 B.C.", "in": { "year": "-0205" } }
    });
  });
});
