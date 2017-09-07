"use strict";

const test = require('tape')
    , { Value, Change, valueEquality } = require('../src/types')

test('anonymous value construction', t => {
  t.plan(9)

  t.throws(() => Value.Anonymous(true), /^TypeError/)
  t.throws(() => Value.Anonymous(null), /^TypeError/)
  t.throws(() => Value.Anonymous(undefined), /^TypeError/)
  t.throws(() => Value.Anonymous({ id: 'identifier' }), /^TypeError/)

  t.equal(Value.Anonymous(42)[0], 42)
  t.equal(Value.Anonymous('foo')[0], 'foo')

  t.deepEqual(Value.Anonymous({ foo: 'bar' })[0], { foo: 'bar' })
  t.deepEqual(Value.Anonymous({ id: '@id' })[0], { id: '@id' })
  t.deepEqual(Value.Anonymous([ 1, 2 ])[0], [ 1, 2 ])
})

test('identified value construction', t => {
  t.plan(9)

  t.throws(() => Value.Identified(true), /^TypeError/)
  t.throws(() => Value.Identified(null), /^TypeError/)
  t.throws(() => Value.Identified(undefined), /^TypeError/)
  t.throws(() => Value.Identified(42), /^TypeError/)
  t.throws(() => Value.Identified('foo'), /^TypeError/)
  t.throws(() => Value.Identified({ foo: 'bar' }), /^TypeError/)
  t.throws(() => Value.Identified([ 1, 2 ]), /^TypeError/)
  t.throws(() => Value.Identified({ id: '@id' }), /^TypeError/)

  t.deepEqual(Value.Identified({ id: 'identifier' })[0], { id: 'identifier' })
})

test('valueEquality', t => {
  t.plan(5)

  t.equal(valueEquality(
    Value.Anonymous('foo'), Value.Anonymous('foo')), true)
  t.equal(valueEquality(
    Value.Anonymous(5), Value.Anonymous(5)), true)
  t.equal(valueEquality(
    Value.Anonymous({a:1}), Value.Anonymous({a:2})), false)
  t.equal(valueEquality(
    Value.Identified({id:9, a:1}), Value.Identified({id:9, a:2})), true)
  t.equal(valueEquality(
    Value.Anonymous({id:'@id', a:1}), Value.Anonymous({id:'@id', a:2})), false)
})

test('change construction', t => {
  t.plan(9)

  t.equal(Change.Addition('foo')[0], 'foo')
  t.equal(Change.Deletion('foo')[0], 'foo')
  t.equal(Change.Preservation('foo')[0], 'foo')

  t.throws(() => Change.Mutation('foo', 'bar'), /^TypeError/)

  t.deepEqual(Change.Addition({ id: 1 })[0], { id: 1 })
  t.deepEqual(Change.Deletion({ id: 1 })[0], { id: 1 })
  t.deepEqual(
    Change.Mutation({ id: 1, x: 1 }, { id: 1, x: 2 })[0],
    { id: 1, x: 1 }
  )
  t.deepEqual(
    Change.Mutation({ id: 1, x: 1 }, { id: 1, x: 2 })[1],
    { id: 1, x: 2 }
  )
  t.deepEqual(Change.Preservation({ id: 1 })[0], { id: 1 })
})
