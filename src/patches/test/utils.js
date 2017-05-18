"use strict";

const test = require('tape')
    , Immutable = require('immutable')
    , { PatchType } = require('../types')

test('Patch formatting', t => {
  t.plan(7);

  const { formatPatch } = require('../utils/patch');

  const initialData = Immutable.fromJS(require('./fixtures/period-collection.json'));
  const path = ['periodCollections', 'p03377f', 'definitions', 'p03377fkhrv', 'editorialNote'];
  const updatedData = initialData.setIn(path, 'This is an editorial note.');

  const patch = formatPatch(initialData.toJS(), updatedData.toJS(), '');

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

test('Patch utils', t => {
  t.plan(6);

  const { makePatch } = require('../utils/patch')
      , data = Immutable.fromJS(require('./fixtures/period-collection.json'))

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
    makePatch(data.toJS(), data.toJS()),
    [],
    'should not detect any changes between two identical datasets'
  );


  const { groupByChangeType } = require('../utils/patch_collection')
      , patches = Immutable.fromJS(samplePatches).toList()

  t.deepEqual(groupByChangeType(patches).toJS(), {
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
  }, '# TODO should group patches together');


  const attrPath = ['periodCollections', 'p03377f', 'source']
      , newData = data.setIn(attrPath.concat('yearPublished'), '1900')
      , patch = makePatch(data.toJS(), newData.toJS())

  t.deepEqual(patch, [
    {
      op: 'add',
      path: '/' + attrPath.join('/'),
      value: newData.getIn(attrPath).toJS()
    }
  ], 'should use "add" operation for simple values instead of "replace"');


  const attrPath2 = ['periodCollections', 'p03377f', 'definitions', 'p03377fkhrv', 'spatialCoverage']

  const newData2 = data.updateIn(attrPath2, sc => {
    return sc.unshift(Immutable.Map({ id: 'http://example.com/', label: 'New country' }));
  });

  const patch2 = makePatch(data.toJS(), newData2.toJS());

  t.deepEqual(patch2, [
    {
      op: 'add',
      path: '/' + attrPath2.join('/'),
      value: newData2.getIn(attrPath2).toJS()
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

test('Patch collection hash filtering', async t => {
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

  {
    const filteredPatches = await filterByHash(patches, true, matcher)

    t.deepEqual(
      filteredPatches.toJS(),
      [ patches.toJS()[0], patches.toJS()[2] ],
      'should enable patches to be filtered by hash');
  }


  const noneMatcher = () => [];

  {
    const filteredPatches = await filterByHash(patches, true, noneMatcher)

    t.deepEqual(
      filteredPatches.toJS(),
      [ patches.toJS()[2] ],
      'should only return additions when no hashes match');
  }
});


