"use strict";

const test = require('tape');
const Immutable = require('immutable');

test('Patch formatting', function (t) {
  t.plan(7);

  const { formatPatch } = require('../utils/patch');

  const initialData = Immutable.fromJS(require('./data/period-collection.json'));
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
