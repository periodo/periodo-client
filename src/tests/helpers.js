"use strict";

var assert = require('assert')
  , Immutable = require('immutable')

describe('', function () {
  var termini = Immutable.fromJS([
    { label: '1200', in: { year: '1200' }},
    { label: '6th century', in: { earliestYear: '0501', latestYear: '0600' }},
    { label: 'one hundred bee cee', in: { year: '-0099' }},
    { label: 'present' },
    { label: 'unknown' }
  ])

  describe('Period terminus helpers', function () {
    it('should find smallest year in terminus', function () {
      var { getEarliestYear } = require('../helpers/terminus');
      assert.deepEqual(
        termini.map(getEarliestYear).toJS(),
        [1200, 501, -99, (new Date().getFullYear()), null]
      );
    });

    it('should find largest year in terminus', function () {
      var { getLatestYear } = require('../helpers/terminus');
      assert.deepEqual(
        termini.map(getLatestYear).toJS(),
        [1200, 600, -99, (new Date().getFullYear()), null]
      );
    });

    it('should detect whether a terminus has any ISO value', function () {
      var { hasISOValue } = require('../helpers/terminus');
      assert.deepEqual(
        termini.map(hasISOValue).toJS(),
        [true, true, true, true, false]
      );
    });

    it('should detect whether a terminus was autoparsed or not', function () {
      var { wasAutoparsed } = require('../helpers/terminus');
      assert.deepEqual(
        termini.map(wasAutoparsed).toJS(),
        [true, true, false, true, false]
      );
    });
  });

  describe('Period terminus collection helpers', function () {
    it('should be able to find the latest terminus in a group', function () {
      var { maxYear } = require('../helpers/terminus_collection');
      assert.deepEqual(
        maxYear(termini),
        { label: 'present', iso: (new Date().getFullYear()) }
      );
    });

    it('should be able to find the earliest terminus in a group', function () {
      var { minYear } = require('../helpers/terminus_collection');
      assert.deepEqual(
        minYear(termini),
        { label: 'one hundred bee cee', iso: -99 }
      );
    });
  });
});

describe('', function () {
  describe('Periodization helpers', function () {
    it('should describe a periodization', function () {
      var { describe } = require('../helpers/periodization')
        , data = Immutable.fromJS(require('./data/period-collection.json'))

      assert.deepEqual(describe(data), {
        id: 'p03377f',
        source: 'Ruiz, Arturo. (1998), The archaeology of the Iberians',
        definitions: 2,
        earliest: {
          iso: -799,
          label: '800 B.C.'
        },
        latest: {
          iso: -205,
          label: '206 B.C.'
        }
      });
    });
  });

  describe('Periodization collection helpers', function () {
    it('Should group spatial coverage collections', function () {
      var { getSpatialCoverages } = require('../helpers/periodization_collection')
        , data

      data = Immutable.fromJS([
        { definitions: [ { spatialCoverageDescription: 'Middle East', spatialCoverage: [ 'a' ] }]},
        { definitions: [ { spatialCoverageDescription: 'Middle East', spatialCoverage: [ 'a' ] }]},
        { definitions: [ { spatialCoverageDescription: 'Middle East', spatialCoverage: [ 'a', 'b' ] }]},
        { definitions: [ { spatialCoverageDescription: 'Middle East 2', spatialCoverage: [ 'a' ] }]},
      ]);

      assert.deepEqual(getSpatialCoverages(data).toJS(), [
        {
          label: 'Middle East',
          uses: [
            { count: 2, countries: ['a'] },
            { count: 1, countries: ['a', 'b']}
          ]
        },
        {
          label: 'Middle East 2',
          uses: [
            { count: 1, countries: ['a'] }
          ]
        }
      ]);
    });
  });
});

describe('Period helpers', function () {
  it('should provide validation', function () {
    var { validate } = require('../helpers/period')
      , data = {}

    data.nothing = Immutable.fromJS({});
    data.noDates = Immutable.fromJS({
      label: 'Progressive Era'
    });
    data.mixedEndpoints = Immutable.fromJS({
      label: 'Progressive Era',
      stop: { label: '1890', in: { year: '1890' }},
      start: { label: '1917', in: { year: '1917' }}
    });
    data.fine = Immutable.fromJS({
      label: 'Progressive Era',
      start: { label: '1890', in: { year: '1890' }},
      stop: { label: '1917', in: { year: '1917' }}
    });


    assert.deepEqual(validate(data.nothing), {
      label: ['This field is required.'],
      dates: ['A period must have start and stop dates.']
    });

    assert.deepEqual(validate(data.noDates), {
      dates: ['A period must have start and stop dates.']
    });

    assert.deepEqual(validate(data.mixedEndpoints), {
      dates: ["A period's stop must come after its start."]
    });

    assert.deepEqual(validate(data.fine), null);
  });
});
