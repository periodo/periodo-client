"use strict";

const test = require('tape')
    , { Change, valueEquals, isAnonymous, isIdentified } = require('../src/components/diffable/types')

test('Anonymous values', t => {
  t.plan(8)

  t.false(
    isAnonymous(true),
    'cannot be booleans')

  t.false(
    isAnonymous(null),
    'cannot be null')

  t.false(
    isAnonymous(undefined),
    'cannot be undefined')

  t.false(
    isAnonymous({ id: 'identifier' }),
    'cannot be identified objects')

  t.true(
    isAnonymous(42),
    'can be a number')

  t.true(
    isAnonymous('foo'),
    'can be a string')

  t.true(
    isAnonymous({ foo: 'bar' }),
    'can be an unidentified object')

  t.true(
    isAnonymous({ id: '@id' }),
    'can be an object whose id is `@id`')
})

test('Identified values', t => {
  t.plan(9)

  t.false(
    isIdentified(true),
    'cannot be a boolean')

  t.false(
    isIdentified(null),
    'cannot be null')

  t.false(
    isIdentified(undefined),
    'cannot be undefined')

  t.false(
    isIdentified(42),
    'cannot be a number')

  t.false(
    isIdentified('foo'),
    'cannot be a string')

  t.false(
    isIdentified({ foo: 'bar' }),
    'cannot be an object without an `id` property')

  t.false(
    isIdentified([ 1, 2 ]),
    'cannot be an array')

  t.false(
    isIdentified({ id: '@id' }),
    'cannot be a an object whose `id` property is `@id`')

  t.true(
    isIdentified({ id: 'identifier' }),
    'can be an object with an `id` property')
})

test('Value equality', t => {
  t.plan(3)

  t.true(
    valueEquals('foo', 'foo'),
    'is true when two anonymous values have strict equality')

  t.true(
    valueEquals({ a: 1 }, { a: 1 }),
    'is true when two anonymouse values which are equal according to `R.equals`')

  t.true(
    valueEquals(
      {
        id: 9,
        a: 1,
      },
      {
        id: 9,
        a: 2,
      }),
    'is true when two identified values have the same `id` property')

})

test('Changes', t => {
  t.plan(9)

  t.equal(Change.Addition('foo').value, 'foo')
  t.equal(Change.Deletion('foo').value, 'foo')
  t.equal(Change.Preservation('foo').value, 'foo')

  t.throws(
    () => Change.Mutation('foo', 'bar'),
    /^TypeError/,
    'are not valid when mutations contain non-identified values')

  t.deepEqual(
    Change.Addition({ id: 1 }).value,
    { id: 1 })

  t.deepEqual(
    Change.Deletion({ id: 1 }).value,
    { id: 1 })

  t.deepEqual(
    Change.Mutation(
      {
        id: 1,
        x: 1,
      },
      {
        id: 1,
        x: 2,
      }
    ).from,
    {
      id: 1,
      x: 1,
    }
  )
  t.deepEqual(
    Change.Mutation(
      {
        id: 1,
        x: 1,
      },
      {
        id: 1,
        x: 2,
      }
    ).to,
    {
      id: 1,
      x: 2,
    }
  )

  t.deepEqual(
    Change.Preservation({ id: 1 }).value,
    { id: 1 })
})
