/* global describe, it */

"use strict";

var assert = require('assert')
  , Immutable = require('immutable')

if (!window.Promise) {
  window.Promise = require('dexie').Promise;
}

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
        , data = Immutable.fromJS(require('./data/period-collection.json').periodCollections.p03377f)

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

describe('Period collection helpers', function () {
  it('should put period ranges into bins', function () {
    var { makeRangeBins } = require('../helpers/period_collection')
      , periods

    periods = Immutable.fromJS([
      { start: { in: { year: 100 }}, stop: { in: { year: 200 }}},
      { start: { in: { year: 100 }}, stop: { in: { year: 200 }}},
      { start: { in: { earliestYear: 150 }}, stop: { in: { year: 200 }}},
    ]);

    assert.deepEqual(makeRangeBins(periods, 4).toJS(), [
      { earliest: 100, latest: 125, count: 2 },
      { earliest: 125, latest: 150, count: 2 },
      { earliest: 150, latest: 175, count: 3 },
      { earliest: 175, latest: 200, count: 3 }
    ]);

  });
});

describe('Patch collection helpers', function () {
  var patches = Immutable.fromJS([
    { op: 'remove', path: '/an/edit' },
    { op: 'add', path: '/an/edit' },
    { op: 'remove', path: '/real/removal' },
    { op: 'add', path: '/real/add' }
  ]);

  it('should be able to detect patch change pairs', function () {
    var { combineChangePairs } = require('../helpers/patch_collection')

    assert.deepEqual(combineChangePairs(patches).toJS(), [
      [ { op: 'remove', path: '/an/edit' }, { op: 'add', path: '/an/edit' } ],
      { op: 'remove', path: '/real/removal' },
      { op: 'add', path: '/real/add' }
    ]);
  });

  describe('Hash filter', function () {
    var { filterByHash } = require('../helpers/patch_collection')
      , expectedHashes

    expectedHashes = [
      // Hash of '{"op":"remove","path":"/real/removal"}'
      '853d0d152a3988088d49e40eaf0a9ba0',

      // Hash of '{"op":"add","path":"/an/edit"}'
      'ce7bac76879ea3bc97b0ffdea4b0daf4',
    ]

    it('should enable patches to be filtered by hash', function () {
      function matcher(hashes) {
        assert(hashes.toSet().equals(Immutable.Set(expectedHashes)));
        return [expectedHashes[1]]
      }
      return filterByHash(patches, true, matcher).then(function (filteredPatches) {
        assert.deepEqual(
          filteredPatches.toJS().sort(),
          patches.splice(2, 1).toJS().sort());
      });
    });

    it('should only return additions when no hashes match', function () {
      function noneMatcher() { return [] }
      return filterByHash(patches, true, noneMatcher).then(function (filteredPatches) {
        assert.deepEqual(filteredPatches.toJS(), [patches.toJS()[3]]);
      });
    });
  });
});

describe('Skolem ID helpers', function () {
  var oldRecord

  oldRecord = Immutable.fromJS({
    a: 'http://example.com/.well-known/genid/abc123',
    b: [
      'c', 'http://example.com/.well-known/genid/def456'
    ],
    e: {
      'http://example.com/.well-known/genid/jkl012': {
        f: 'http://example.com/.well-known/genid/ghi789'
      }
    }
  });

  it('should be able to replace IDs in a data structure', function () {
    var { replaceIDs } = require('../helpers/skolem_ids')
      , skolemMap

    skolemMap = Immutable.Map({
      'http://example.com/.well-known/genid/abc123': 'id1',
      'http://example.com/.well-known/genid/def456': 'id2',
      'http://example.com/.well-known/genid/jkl012': 'id3',
      'http://example.com/.well-known/genid/ghi789': 'id4'
    });

    assert.deepEqual(replaceIDs(oldRecord, skolemMap).toJS(), {
      a: 'id1',
      b: [
        'c', 'id2'
      ],
      e: {
        id3: {
          f: 'id4'
        }
      }
    });
  });
});
