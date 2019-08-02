"use strict";

const test = require('blue-tape')
    , R = require('ramda')
    , { PatchType } = require('../types')

test('Formatting and hashing patches', async t => {
  const { formatPatch } = require('../patch');

  const initialData = R.clone(require('./fixtures/authority.json'));

  const path = [
    'authorities',
    'p03377f',
    'periods',
    'p03377fkhrv',
    'editorialNote',
  ]

  const updatedData = R.assocPath(path, 'This is an editorial note.', initialData);

  const patch = formatPatch(initialData, updatedData, '');

  t.deepEqual(patch.forward, [
    {
      op: 'add',
      path: `/${path.join('/')}`,
      value: 'This is an editorial note.',
    },
  ])

  t.deepEqual(patch.backward, [
    {
      op: 'remove',
      path: `/${path.join('/')}`,
    },
  ]);

  // Hash of '{"op":"add","path":"/authorities/p03377f/periods/p03377fkhrv/editorialNote","value":"This is an editorial note."}'
  t.deepEqual(patch.forwardHashes, [ '74ef216d2a904a8bcca5569f65956133' ]);

  // Hash of '{"op":"remove","path":"/authorities/p03377f/periods/p03377fkhrv/editorialNote"}'
  t.deepEqual(patch.backwardHashes, [ '5736c4b2aa8e19d190136510e8f0dd31' ]);

  t.deepEqual(patch.affectedAuthorities, [ 'p03377f' ]);
  t.deepEqual(patch.affectedPeriods, [ 'p03377fkhrv' ]);

  t.equal(
    patch.message,
    'Changed editorialNote of period p03377fkhrv in authority p03377f.');
})


test('Patch utils', async t => {
  const { makePatch } = require('../patch')
      , data = R.clone(require('./fixtures/authority.json'))

  const samplePatches = {
    addPeriod: {
      op: 'add',
      path: '/authorities/a/periods/b',
    },
    removePeriod: {
      op: 'remove',
      path: '/authorities/a/periods/b',
    },
    changePeriod: {
      op: 'add',
      path: '/authorities/a/periods/b/note',
    },
  }

  t.deepEqual(
    makePatch(data, data),
    [],
    'should not detect any changes between two identical datasets'
  );

  const { groupByChangeType } = require('../patch_collection')
      , patches = R.values(samplePatches)

  t.deepEqual(groupByChangeType(patches), {
    AddPeriod: {
      a: [ samplePatches.addPeriod ],
    },
    RemovePeriod: {
      a: [ samplePatches.removePeriod ],
    },
    ChangePeriod: {
      a: {
        b: [ samplePatches.changePeriod ],
      },
    },
  }, 'should group patches together');


  const attrPath = [ 'authorities', 'p03377f', 'source' ]
      , newData = R.assocPath(attrPath.concat('yearPublished'), '1900', data)
      , patch = makePatch(data, newData)

  t.deepEqual(patch, [
    {
      op: 'add',
      path: '/' + attrPath.join('/'),
      value: R.view(R.lensPath(attrPath), newData),
    },
  ], 'should use "add" operation for simple values instead of "replace"');


  const attrPath2 = [
    'authorities',
    'p03377f',
    'periods',
    'p03377fkhrv',
    'spatialCoverage',
  ]

  const newData2 = R.over(
    R.lensPath(attrPath2),
    sc => sc.concat([
      {
        id: 'http://example.com/',
        label: 'New country',
      },
    ]),
    data)


  const patch2 = makePatch(data, newData2);

  t.deepEqual(patch2, [
    {
      op: 'add',
      path: '/' + attrPath2.join('/'),
      value: R.view(R.lensPath(attrPath2), newData2),
    },
  ], 'should use "add" operation for complex values instead of "replace"');

  const samples = [
    samplePatches.addPeriod,
    samplePatches.removePeriod,
    samplePatches.changePeriod,
  ]

  t.deepEquals(samples.map(PatchType.fromPatch), [
    PatchType.AddPeriod('a', 'b'),
    PatchType.RemovePeriod('a', 'b'),
    PatchType.ChangePeriod('a', 'b', 'note'),
  ])

  t.deepEquals(samples.map(PatchType.fromPatch).map(t => t.getLabel()), [
    'Added period b in authority a.',
    'Removed period b in authority a.',
    'Changed note of period b in authority a.',
  ], 'should describe patches in English')


  t.deepEquals(
    PatchType.fromPatch({
      op: 'add',
      path: '/nonsense',
    }),
    PatchType.Unknown
  )
});

// TODO: Move this to linked-data module
test('Skolem ID utils', t => {
  t.plan(1);

  const { replaceIDs } = require('../../linked-data/utils/skolem_ids')

  const oldRecord = {
    a: 'http://example.com/.well-known/genid/abc123',
    b: [
      'c', 'http://example.com/.well-known/genid/def456',
    ],
    e: {
      'http://example.com/.well-known/genid/jkl012': {
        f: 'http://example.com/.well-known/genid/ghi789',
      },
    },
  }

  const skolemMap = {
    'http://example.com/.well-known/genid/abc123': 'id1',
    'http://example.com/.well-known/genid/def456': 'id2',
    'http://example.com/.well-known/genid/jkl012': 'id3',
    'http://example.com/.well-known/genid/ghi789': 'id4',
  }

  t.deepEqual(replaceIDs(oldRecord, skolemMap), {
    a: 'id1',
    b: [
      'c', 'id2',
    ],
    e: {
      id3: {
        f: 'id4',
      },
    },
  });

});

test('Patch collection hash filtering', async t => {
  const { filterByHash } = require('../patch_collection');

  const patches = [
    {
      op: 'add',
      path: '/authorities/a/periods/aa/note',
    },
    {
      op: 'remove',
      path: '/authorities/b',
    },
    {
      op: 'add',
      path: '/authorities/c',
    },
  ]

  const matcher = hashes => {
    // Hash of '{"op":"add","path":"/authorities/a/periods/aa/note"}'
    const expectedHash = 'acbf17d2f121127d02a6afeef294b07d'

    t.deepEqual(hashes, [ expectedHash ]);

    return [ expectedHash ];
  }

  {
    const filteredPatches = await filterByHash(patches, true, matcher)

    t.deepEqual(
      filteredPatches,
      [ patches[0], patches[2] ],
      'should enable patches to be filtered by hash');
  }


  const noneMatcher = () => [];

  {
    const filteredPatches = await filterByHash(patches, true, noneMatcher)

    t.deepEqual(
      filteredPatches,
      [ patches[2] ],
      'should only return additions when no hashes match');
  }
});
