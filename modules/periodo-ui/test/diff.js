"use strict";

/* eslint object-property-newline: 0, array-bracket-spacing: 0 object-curly-newline: 0 */

const test = require('tape')
    , { Change } = require('../src/diffable/types')
    , { findChanges } = require('../src/diffable/Diff')

test('findChanges', t => {
  t.plan(11)

  t.deepEqual(
    findChanges([ 1 ], [ 2 ]),
    [ Change.Deletion(1), Change.Addition(2) ],
    'should detect changes in non-identified values'
  )

  t.deepEqual(
    findChanges([ 'a' ], [ 'a' ]),
    [ Change.Preservation('a') ],
    'should detect preservations in non-identified values'
  )

  t.deepEqual(
    findChanges(
      [ { id: 5, a: 1 } ],
      [ { id: 6, a: 2 } ]
    ),
    [
      Change.Deletion({ id: 5, a: 1 }),
      Change.Addition({ id: 6, a: 2 }),
    ],
    'should detected changes in identified values'
  )

  t.deepEqual(
    findChanges(
      [ { id: 5, a: 1 } ],
      [ { id: 5, a: 1 } ]
    ),
    [
      Change.Preservation({
        id: 5,
        a: 1,
      }),
    ],
    'should detect preservation in identified values'
  )

  t.deepEqual(
    findChanges(
      [ { id: 5, a: 1 } ],
      [ { id: 5, a: 2 } ]
    ),
    [
      Change.Mutation(
        { id: 5, a: 1 },
        { id: 5, a: 2 }
      ),
    ],
    'should detect mutation of identified values with same ID'
  )

  t.deepEqual(
    findChanges(
      [ 'a', { id: 5 } ],
      [ { id: 5, a: 1 }, 'b' ]
    ),
    [
      Change.Deletion('a'),
      Change.Mutation(
        { id: 5 },
        { id: 5, a: 1 }
      ),
      Change.Addition('b'),
    ],
    'should detect mutation of identified values in different even when they have moved'
  )

  t.deepEqual(
    findChanges(
      [ 'a' ],
      [ 'a', 'a' ]
    ),
    [
      Change.Preservation('a'),
      Change.Addition('a'),
    ],
    'should detect additions of equal values through their position'
  )

  t.deepEqual(
    findChanges(
      [ 'a', 'a' ],
      [ 'a' ]
    ),
    [
      Change.Preservation('a'),
      Change.Deletion('a'),
    ],
    'should detect deltions of equal values through their position'
  )

  t.deepEqual(
    findChanges(
      [ 'a', 'a' ],
      []
    ),
    [
      Change.Deletion('a'),
      Change.Deletion('a'),
    ],
    'should detect multiple deletions'
  )

  t.deepEqual(
    findChanges(
      [
        { id: 1 },
      ],
      [
        { id: 1 },
        { id: 1, a: 1, b: 1 },
        { id: 1, a: 2 },
      ]
    ),
    [
      Change.Mutation(
        { id: 1 },
        { id: 1, a: 2, b: 1 }
      ),
    ],
    'should merge all changes of an identified item into a single mutation (destination)'
  )

  t.deepEqual(
    findChanges(
      [
        { id: 1 },
        { id: 1, a: 1, b: 1 },
        { id: 1, a: 2 },
      ],
      [
        { id: 1 },
      ]
    ),
    [
      Change.Mutation(
        { id: 1, a: 2, b: 1 },
        { id: 1 }
      ),
    ],
    'should merge all changes of an identified item into a single mutation (source)'
  )
})
