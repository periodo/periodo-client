"use strict";

var assert = require('assert');

function copy(json) {
  return JSON.parse(JSON.stringify(json));
}

describe('Source model', function () {
  var Source = require('../models/source')

  it('should parse a source that is part of another source accurately', function () {
    var data = copy(require('./data/source-partof.json'))
      , srcData = copy(data)
      , source = new Source(srcData)

    assert.deepEqual(source.toJSON(), data);
  });
});

describe('Period terminus model', function () {
  var PeriodTerminus = require('../models/period_terminus');

  it('should be aware of its endpoints', function () {
    var pt = new PeriodTerminus({ in: { year: '1900' }});
    assert.equal(pt.hasYearData(), true);
    assert.equal(pt.getEarliestYear(), 1900);
    assert.equal(pt.getLatestYear(), 1900);
  });
});

describe('Period model', function () {
  var Period = require('../models/period');

  it('should have starts and stops', function () {
    var period = new Period();
    assert.deepEqual(period.start().toJSON(), { label: undefined });
    assert.deepEqual(period.stop().toJSON(), { label: undefined });
  });

  it('should let me set starts and stops', function () {
    var period = new Period();
    period.start().set({ in: { year: '1890' }, label: '1890' });
    assert.deepEqual(period.start().toJSON(), { in: { year: '1890' }, label: '1890' });
  });
});

describe('Period collection model', function () {
  var PeriodCollection = require('../models/period_collection')
    , data = copy(require('./data/period-collection.json'))
    , srcData = copy(data)
    , periodCollection = new PeriodCollection(srcData, { parse: true, noMutate: true })

  it('should work', function () {
    assert.deepEqual(periodCollection.toJSON(), data);
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
