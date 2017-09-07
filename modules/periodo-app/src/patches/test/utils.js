"use strict";

const test = require('blue-tape')
    , R = require('ramda')
    , { PatchType } = require('../types')

test('Formatting and hashing patches', async t => {
  const { formatPatch } = require('../utils/patch');

  const initialData = R.clone(require('./fixtures/period-collection.json'));

  const path = [
    'periodCollections',
    'p03377f',
    'definitions',
    'p03377fkhrv',
    'editorialNote'
  ]

  const updatedData = R.assocPath(path, 'This is an editorial note.', initialData);

  const patch = formatPatch(initialData, updatedData, '');

  t.deepEqual(patch.forward, [
    {
      op: 'add',
      path: `/${path.join('/')}`,
      value: 'This is an editorial note.'
    }
  ])

  t.deepEqual(patch.backward, [
    {
      op: 'remove',
      path: `/${path.join('/')}`
    }
  ]);

  t.deepEqual(patch.forwardHashes, ['dcb4af6ca8ac2bd84e61fea381d9fff5']);
  t.deepEqual(patch.backwardHashes, ['3fea72233374c67d98f6208e823480aa']);
  t.deepEqual(patch.affectedCollections, ['p03377f']);
  t.deepEqual(patch.affectedPeriods, ['p03377fkhrv']);

  t.equal(
    patch.message,
    'Changed editorialNote of period p03377fkhrv in collection p03377f.');
})

test('Patch utils', async t => {
  const { makePatch } = require('../utils/patch')
      , data = R.clone(require('./fixtures/period-collection.json'))

  const samplePatches = {
    addPeriod: {
      op: 'add',
      path: '/periodCollections/a/definitions/b'
    },
    removePeriod: {
      op: 'remove',
      path: '/periodCollections/a/definitions/b'
    },
    changePeriod: {
      op: 'add',
      path: '/periodCollections/a/definitions/b/note'
    }
  }

  t.deepEqual(
    makePatch(data, data),
    [],
    'should not detect any changes between two identical datasets'
  );

  const { groupByChangeType } = require('../utils/patch_collection')
      , patches = R.values(samplePatches)

  t.deepEqual(groupByChangeType(patches), {
    AddPeriod: {
      a: [samplePatches.addPeriod]
    },
    RemovePeriod: {
      a: [samplePatches.removePeriod]
    },
    ChangePeriod: {
      a: {
        b: [samplePatches.changePeriod]
      }
    }
  }, 'should group patches together');


  const attrPath = ['periodCollections', 'p03377f', 'source']
      , newData = R.assocPath(attrPath.concat('yearPublished'), '1900', data)
      , patch = makePatch(data, newData)

  t.deepEqual(patch, [
    {
      op: 'add',
      path: '/' + attrPath.join('/'),
      value: R.view(R.lensPath(attrPath), newData)
    }
  ], 'should use "add" operation for simple values instead of "replace"');


  const attrPath2 = [
    'periodCollections',
    'p03377f',
    'definitions',
    'p03377fkhrv',
    'spatialCoverage'
  ]

  const newData2 = R.over(
    R.lensPath(attrPath2),
    sc => sc.concat([
      { id: 'http://example.com/', label: 'New country' }
    ]),
    data)


  const patch2 = makePatch(data, newData2);

  t.deepEqual(patch2, [
    {
      op: 'add',
      path: '/' + attrPath2.join('/'),
      value: R.view(R.lensPath(attrPath2), newData2)
    }
  ], 'should use "add" operation for complex values instead of "replace"');


  const { describePatch, parsePatchPath } = require('../utils/patch')

  t.deepEqual([
    describePatch(samplePatches.addPeriod),
    describePatch(samplePatches.removePeriod),
    describePatch(samplePatches.changePeriod),
  ], [
    {
      type: PatchType.AddPeriod('a', 'b'),
      label: 'Added period b in collection a.',
      collectionID: 'a',
      periodID: 'b',
      attribute: null,
    },
    {
      type: PatchType.RemovePeriod('a', 'b'),
      label: 'Removed period b in collection a.',
      collectionID: 'a',
      periodID: 'b',
      attribute: null,
    },
    {
      type: PatchType.ChangePeriod('a', 'b', 'note'),
      label: 'Changed note of period b in collection a.',
      collectionID: 'a',
      periodID: 'b',
      attribute: 'note',
    },
  ], 'should describe patches in a semantically useful way');


  t.throws(
    () => parsePatchPath({
      op: 'add',
      path: '/periodCollections/a/definitions/b/madeUpField'
    }),
    new Error('Invalid field for a period: madeUpField'),
    'Should throw when attempting to parse invalid patch path.'
  );
});

// TODO: Move this to linked-data module
test('Skolem ID utils', t => {
  t.plan(1);

  const { replaceIDs } = require('../../linked-data/utils/skolem_ids')

  const oldRecord = {
    a: 'http://example.com/.well-known/genid/abc123',
    b: [
      'c', 'http://example.com/.well-known/genid/def456'
    ],
    e: {
      'http://example.com/.well-known/genid/jkl012': {
        f: 'http://example.com/.well-known/genid/ghi789'
      }
    }
  }

  const skolemMap = {
    'http://example.com/.well-known/genid/abc123': 'id1',
    'http://example.com/.well-known/genid/def456': 'id2',
    'http://example.com/.well-known/genid/jkl012': 'id3',
    'http://example.com/.well-known/genid/ghi789': 'id4'
  }

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

test('Patch collection hash filtering', async t => {
  const { filterByHash } = require('../utils/patch_collection');

  const patches = [
    { op: 'add', path: '/periodCollections/a/definitions/aa/note' },
    { op: 'remove', path: '/periodCollections/b' },
    { op: 'add', path: '/periodCollections/c' }
  ]

  const matcher = hashes => {
    // Hash of '{"op":"add","path":"/periodCollections/a/definitions/aa/note"}'
    const expectedHash = '0af819ad2546c595c88eaad3672d4e78'

    t.deepEqual(hashes, [expectedHash]);

    return [expectedHash];
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
