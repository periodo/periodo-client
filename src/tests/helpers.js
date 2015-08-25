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
    { label: '0', in: { year: '0000' }},
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
        [1200, 0, 501, -99, (new Date().getFullYear()), null]
      );
    });

    it('should find largest year in terminus', function () {
      var { getLatestYear } = require('../helpers/terminus');
      assert.deepEqual(
        termini.map(getLatestYear).toJS(),
        [1200, 0, 600, -99, (new Date().getFullYear()), null]
      );
    });

    it('should detect whether a terminus has any ISO value', function () {
      var { hasISOValue } = require('../helpers/terminus');
      assert.deepEqual(
        termini.map(hasISOValue).toJS(),
        [true, true, true, true, true, false]
      );
    });

    it('should detect whether a terminus was autoparsed or not', function () {
      var { wasAutoparsed } = require('../helpers/terminus');
      assert.deepEqual(
        termini.map(wasAutoparsed).toJS(),
        [true, true, true, false, true, false]
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
        source: 'Ruiz, Arturo. The archaeology of the Iberians. 1998.',
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

  it('should get original label from a period', function () {
    var { getOriginalLabel } = require('../helpers/period')
      , data = require('./data/multi-label-period.json')

    assert.deepEqual(
      getOriginalLabel(Immutable.fromJS(data)).toJS(),
      { value: 'Progressive Era', language: 'eng', script: 'latn' }
    )
  });

  it('should get all labels from a period', function () {
    var { getAllLabels } = require('../helpers/period')
      , data = require('./data/multi-label-period.json')

    assert.deepEqual(
      getAllLabels(Immutable.fromJS(data)).toJS(),
      [
        { value: 'Progressive Era', language: 'eng', script: 'latn' },
        { value: 'The Progressive Era', language: 'eng', script: 'latn' },
        { value: 'Ère progressiste', language: 'fra', script: 'latn' },
      ]
    );
  });

  it('should get only alternate labels from a period', function () {
    var { getAlternateLabels } = require('../helpers/period')
      , data = require('./data/multi-label-period.json')

    assert.ok(
      getAlternateLabels(Immutable.fromJS(data)).equals(Immutable.OrderedSet([
        Immutable.Map({ value: 'The Progressive Era', language: 'eng', script: 'latn' }),
        Immutable.Map({ value: 'Ère progressiste', language: 'fra', script: 'latn' })
      ]))
    );
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

    var periods2 = Immutable.fromJS([
      { start: { in: { year: -10000 }}, stop: { in: { year: 0 }}},
      { start: { in: { year: -12 }}, stop: { in: { year: -1 }}}
    ]);

    assert.deepEqual(makeRangeBins(periods2, 10).toJS(), [
      { earliest: -10000, latest: -9000, count: 1 },
      { earliest: -9000, latest: -8000, count: 1 },
      { earliest: -8000, latest: -7000, count: 1 },
      { earliest: -7000, latest: -6000, count: 1 },
      { earliest: -6000, latest: -5000, count: 1 },
      { earliest: -5000, latest: -4000, count: 1 },
      { earliest: -4000, latest: -3000, count: 1 },
      { earliest: -3000, latest: -2000, count: 1 },
      { earliest: -2000, latest: -1000, count: 1 },
      { earliest: -1000, latest: 0, count: 2 }
    ]);

  });
});

describe('Patch collection helpers', function () {
  var patches = Immutable.fromJS([
    { op: 'add', path: '/an/edit' },
    { op: 'remove', path: '/real/removal' },
    { op: 'add', path: '/periodCollections/123' }
  ]);

  describe('Hash filter', function () {
    var { filterByHash } = require('../helpers/patch_collection')
      , expectedHashes

    expectedHashes = [
      // Hash of '{"op":"add","path":"/an/edit"}'
      'ce7bac76879ea3bc97b0ffdea4b0daf4',

      // Hash of '{"op":"remove","path":"/real/removal"}'
      '853d0d152a3988088d49e40eaf0a9ba0',
    ]

    it('should enable patches to be filtered by hash', function () {
      function matcher(hashes) {
        assert(hashes.toSet().equals(Immutable.Set(expectedHashes)));
        return [expectedHashes[0]]
      }
      return filterByHash(patches, true, matcher).then(function (filteredPatches) {
        assert.deepEqual(
          filteredPatches.toJS(),
          [patches.toJS()[0], patches.toJS()[2]]
        )
      });
    });

    it('should only return additions when no hashes match', function () {
      function noneMatcher() { return [] }
      return filterByHash(patches, true, noneMatcher).then(function (filteredPatches) {
        assert.deepEqual(filteredPatches.toJS(), [patches.toJS()[2]]);
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
