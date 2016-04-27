"use strict";

const test = require('tape');
const Immutable = require('immutable');


test('Period terminus helpers', function (t) {
  t.plan(4);

  const helpers = require('../helpers/terminus');
  const termini = Immutable.fromJS(require('./data/termini.json'));

  t.ok(Immutable.is(
    termini.map(helpers.getEarliestYear),
    Immutable.List([1200, 0, 501, -99, (new Date().getFullYear()), null])
  ), 'should find smallest year in terminus');

  t.ok(Immutable.is(
    termini.map(helpers.getLatestYear),
    Immutable.List([1200, 0, 600, -99, (new Date().getFullYear()), null])
  ), 'should find largest year in terminus');

  t.ok(Immutable.is(
    termini.map(helpers.hasISOValue),
    Immutable.List([true, true, true, true, true, false])
  ), 'should detect whether a terminus has any ISO value');

  t.ok(Immutable.is(
    termini.map(helpers.wasAutoparsed),
    Immutable.List([true, true, true, false, true, false])
  ), 'should detect whether a terminus was autoparsed or not');
});


test('Period terminus collection helpers', function (t) {
  t.plan(2);

  const helpers = require('../helpers/terminus_collection');
  const termini = Immutable.fromJS(require('./data/termini.json'));

  t.deepEqual(
    helpers.maxYear(termini),
    { label: 'present', iso: (new Date().getFullYear()) },
    'should be able to find the latest terminus in a group'
  );


  t.deepEqual(
    helpers.minYear(termini),
    { label: 'one hundred bee cee', iso: -99 },
    'should be able to find the earliest terminus in a group'
  );
});


test('Periodization helpers', function (t) {
  t.plan(1);

  const helpers = require('../helpers/periodization');
  const data = Immutable.fromJS(require('./data/period-collection.json'));

  t.deepEqual(helpers.describe(data.getIn(['periodCollections', 'p03377f'])), {
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
  }, 'should describe a periodization');
});


test('Periodization collection helpers', function (t) {
  t.plan(1);

  const helpers = require('../helpers/periodization_collection');

  const data = Immutable.fromJS([
    { definitions: [ { spatialCoverageDescription: 'Middle East', spatialCoverage: [ 'a' ] }]},
    { definitions: [ { spatialCoverageDescription: 'Middle East', spatialCoverage: [ 'a' ] }]},
    { definitions: [ { spatialCoverageDescription: 'Middle East', spatialCoverage: [ 'a', 'b' ] }]},
    { definitions: [ { spatialCoverageDescription: 'Middle East 2', spatialCoverage: [ 'a' ] }]},
  ]);


  t.deepEqual(
    helpers.getSpatialCoverages(data).toJS(),
    [
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
    ], 'Should group spatial coverage collections');
});


test('Period validation', function (t) {
  t.plan(5);

  const helpers = require('../helpers/period');

  const data = Immutable.fromJS({
    nothing: {},
    noDates: {
      label: 'Progressive Era'
    },
    mixedEndpoints: {
      label: 'Progressive Era',
      stop: { label: '1890', in: { year: '1890' }},
      start: { label: '1917', in: { year: '1917' }}
    },
    fine: {
      label: 'Progressive Era',
      start: { label: '1890', in: { year: '1890' }},
      stop: { label: '1917', in: { year: '1917' }}
    },
    zeroTerminus: {
      label: 'A Long Time Ago',
      start: { label: '2450 BP', in: { year: '-0500' }},
      stop: { label: '1950 BP', in: { year: '0000' }}
    }
  });

  t.deepEqual(helpers.validate(data.get('nothing')), {
    label: ['This field is required.'],
    dates: ['A period must have start and stop dates.']
  });

  t.deepEqual(helpers.validate(data.get('noDates')), {
    dates: ['A period must have start and stop dates.']
  });

  t.deepEqual(helpers.validate(data.get('mixedEndpoints')), {
    dates: ["A period's stop must come after its start."]
  });

  t.deepEqual(helpers.validate(data.get('fine')), null);

  t.deepEqual(helpers.validate(data.get('zeroTerminus')), null);
});


test('Multi label periods', function (t) {
  t.plan(3)

  const helpers = require('../helpers/period');
  const multiLabelPeriod = Immutable.fromJS(require('./data/multi-label-period.json'));

  t.ok(Immutable.is(
    helpers.getOriginalLabel(multiLabelPeriod),
    Immutable.fromJS({
      value: 'Progressive Era',
      language: 'eng',
      script: 'latn'
    }), 'should get original label from a period'));


  t.deepEqual(
    helpers.getAllLabels(multiLabelPeriod).toJS(),
    [
      { value: 'Progressive Era', language: 'eng', script: 'latn' },
      { value: 'The Progressive Era', language: 'eng', script: 'latn' },
      { value: 'Ère progressiste', language: 'fra', script: 'latn' },
    ], 'should get all labels from a period');


  t.ok(Immutable.is(
    helpers.getAlternateLabels(multiLabelPeriod),
    Immutable.OrderedSet([
      Immutable.Map({ value: 'The Progressive Era', language: 'eng', script: 'latn' }),
      Immutable.Map({ value: 'Ère progressiste', language: 'fra', script: 'latn' })
    ])), 'should get only alternate labels from a period')
});


test('Period range bins', function (t) {
  t.plan(2);

  const { makeRangeBins } = require('../helpers/period_collection');

  const periods = Immutable.fromJS([
    { start: { in: { year: 100 }}, stop: { in: { year: 200 }}},
    { start: { in: { year: 100 }}, stop: { in: { year: 200 }}},
    { start: { in: { earliestYear: 150 }}, stop: { in: { year: 200 }}},
  ]);

  const periods2 = Immutable.fromJS([
    { start: { in: { year: -10000 }}, stop: { in: { year: 0 }}},
    { start: { in: { year: -12 }}, stop: { in: { year: -1 }}}
  ]);

  t.ok(Immutable.is(
    makeRangeBins(periods, 4),
    Immutable.fromJS([
      { earliest: 100, latest: 125, count: 2 },
      { earliest: 125, latest: 150, count: 2 },
      { earliest: 150, latest: 175, count: 3 },
      { earliest: 175, latest: 200, count: 3 }
    ])));

  t.ok(Immutable.is(
    makeRangeBins(periods2, 10),
    Immutable.fromJS([
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
    ])))
});


test('Patch collection hash filtering', function (t) {
  t.plan(3);

  const { filterByHash } = require('../helpers/patch_collection');

  const patches = Immutable.fromJS([
    { op: 'add', path: '/an/edit' },
    { op: 'remove', path: '/real/removal' },
    { op: 'add', path: '/periodCollections/123' }
  ]);

  const expectedHashes = [
    // Hash of '{"op":"add","path":"/an/edit"}'
    'ce7bac76879ea3bc97b0ffdea4b0daf4',

    // Hash of '{"op":"remove","path":"/real/removal"}'
    '853d0d152a3988088d49e40eaf0a9ba0',
  ];


  const matcher = hashes => {
    t.ok(hashes.toSet().equals(Immutable.Set(expectedHashes)));
    return [ expectedHashes[0] ];
  }

  filterByHash(patches, true, matcher).then(filteredPatches => {
    t.deepEqual(
      filteredPatches.toJS(),
      [ patches.toJS()[0], patches.toJS()[2] ],
      'should enable patches to be filtered by hash');
  });


  const noneMatcher = () => [];

  filterByHash(patches, true, noneMatcher).then(filteredPatches => {
    t.deepEqual(
      filteredPatches.toJS(),
      [ patches.toJS()[2] ],
      'should only return additions when no hashes match');
  });
});

test('Skolem ID helpers', function (t) {
  t.plan(1);

  const { replaceIDs } = require('../helpers/skolem_ids')

  const oldRecord = Immutable.fromJS({
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

  const skolemMap = Immutable.Map({
    'http://example.com/.well-known/genid/abc123': 'id1',
    'http://example.com/.well-known/genid/def456': 'id2',
    'http://example.com/.well-known/genid/jkl012': 'id3',
    'http://example.com/.well-known/genid/ghi789': 'id4'
  });

  t.deepEqual(replaceIDs(oldRecord, skolemMap).toJS(), {
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
