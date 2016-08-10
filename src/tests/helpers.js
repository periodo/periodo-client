const test = require('tape')
    , Immutable = require('immutable')

test('Skolem ID utils', t => {
  t.plan(1);

  const { replaceIDs } = require('../utils/skolem_ids')

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

test('Patch collection hash filtering', t => {
  t.plan(3);

  const { filterByHash } = require('../utils/patch_collection');

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



test('Period range bins', t => {
  t.plan(2);

  const { makeRangeBins } = require('../utils/period_collection');

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

test('Period validation', t => {
  t.plan(5);

  const utils = require('../utils/period');

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

  t.deepEqual(utils.validate(data.get('nothing')), {
    label: ['This field is required.'],
    dates: ['A period must have start and stop dates.']
  });

  t.deepEqual(utils.validate(data.get('noDates')), {
    dates: ['A period must have start and stop dates.']
  });

  t.deepEqual(utils.validate(data.get('mixedEndpoints')), {
    dates: ["A period's stop must come after its start."]
  });

  t.deepEqual(utils.validate(data.get('fine')), null);

  t.deepEqual(utils.validate(data.get('zeroTerminus')), null);
});
