"use strict";

const test = require('blue-tape')
    , { extract } = require('../src/components/diffable/Field')

test('Extract function', async t => {
  t.plan(7)

  const o = {
    a: 1,
    b: [ 'foo', 'bar' ],
    c: { id: 1 },
    d: null,
    f: true,
  }

  t.deepEqual(
    extract('a')(o),
    [ 1 ]
  )

  t.deepEqual(
    extract('b')(o),
    [ 'foo', 'bar' ]
  )

  t.deepEqual(
    extract('c')(o),
    [{ id: 1 }]
  )

  t.deepEqual(
    extract([ 'c', 'id' ])(o),
    [ 1 ]
  )

  t.deepEqual(
    extract('d')(o),
    []
  )

  t.deepEqual(
    extract('e')(o),
    []
  )

  t.throws(() => extract('f')(o), /^TypeError/)
})

test('Extract with key', async t => {
  t.plan(5)

  const o = {
    a: 1,
    b: [ 'foo', 'bar' ],
    c: { id: 1 },
    d: null,
    f: true,
  }

  t.deepEqual(
    extract('a', { withKey: 'x' })(o),
    [{
      id: 0,
      x: 1,
    }]
  )

  t.deepEqual(
    extract('b', { withKey: 'x' })(o),
    [
      {
        id: 0,
        x: 'foo',
      },
      {
        id: 1,
        x: 'bar',
      },
    ]
  )
  t.deepEqual(
    extract('c', { withKey: 'x' })(o),
    [
      { id: 1 },
    ]
  )

  t.deepEqual(
    extract([ 'c', 'id' ], { withKey: 'x' })(o),
    [
      {
        id: 0,
        x: 1,
      },
    ]
  )

  t.deepEqual(
    extract('d', { withKey: 'x' })(o),
    []
  )
})
