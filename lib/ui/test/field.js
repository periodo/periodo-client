"use strict";

const test = require('tape')
    , { Value } = require('../types')
    , { extract, as } = require('../Field')

test('extract', t => {
  t.plan(7)

  const o = { a: 1, b: [ 'foo', 'bar' ], c: { id: 1 }, d: null, f: true }

  t.deepEqual(
    extract('a')(o),
    [ Value.Anonymous(1) ]
  )
  t.deepEqual(
    extract('b')(o),
    [ Value.Anonymous('foo'), Value.Anonymous('bar') ]
  )
  t.deepEqual(
    extract('c')(o),
    [ Value.Identified({ id: 1 }) ]
  )
  t.deepEqual(
    extract([ 'c', 'id' ])(o),
    [ Value.Anonymous(1) ]
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

test('extract as', t => {
  t.plan(5)

  const o = { a: 1, b: [ 'foo', 'bar' ], c: { id: 1 }, d: null, f: true }

  t.deepEqual(
    as('x')(extract('a'))(o),
    [ Value.Identified({ id: 0, x: 1 }) ]
  )
  t.deepEqual(
    as('x')(extract('b'))(o),
    [ Value.Identified({ id: 0, x: 'foo' })
    , Value.Identified({ id: 1, x: 'bar' })
    ]
  )
  t.deepEqual(
    as('x')(extract('c'))(o),
    [ Value.Identified({ id: 1 }) ]
  )
  t.deepEqual(
    as('x')(extract([ 'c', 'id' ]))(o),
    [ Value.Identified({ id: 0, x: 1 }) ]
  )
  t.deepEqual(
    as('x')(extract('d'))(o),
    []
  )
})
