"use strict";

const test = require('tape')
    , R = require('ramda')
    , { hasID, equalByIDOrValue, compareLists } = require('../Field')

test('hasID', t => {
  t.plan(5)

  t.equal(hasID('str'), false)
  t.equal(hasID({a: 1}), false)
  t.equal(hasID({id: 1}), true)
  t.equal(hasID({id: 'a'}), true)
  t.equal(hasID({id: '@id'}), false)
})

test('equalByIDOrValue', t => {
  t.plan(6)

  t.equal(equalByIDOrValue(undefined, undefined), true)
  t.equal(equalByIDOrValue('foo', 'foo'), true)
  t.equal(equalByIDOrValue(5, 5), true)
  t.equal(equalByIDOrValue({a:1}, {a:2}), false)
  t.equal(equalByIDOrValue({id:9, a:1}, {id:9, a:2}), true)
  t.equal(equalByIDOrValue({id:'@id', a:1}, {id:'@id', a:2}), false)
})

test('R.innerJoin(equalByIDOrValue)', t => {
  t.plan(2)

  t.deepEqual(
    R.innerJoin(equalByIDOrValue)(
      ['a', 1, undefined, {a:1}, {id:5, a:2}, {id:5, a:3}, 1],
      [1, {id:5}, undefined]
    ),
    [1, undefined, {id:5, a:2}, {id:5, a:3}, 1]
  )
  t.deepEqual(
    R.innerJoin(equalByIDOrValue)(
      ['a', 1, undefined, {a:1}, {id:5, a:2}],
      [1, {id:5}, undefined]
    ),
    [1, undefined, {id:5, a:2}]
  )
})

test('compareLists(diffInside = false)', t => {
  t.plan(7)

  t.deepEqual(
    compareLists(false)([1], [2]),
    [ {value: 1, deleted: true, added: false, changed: undefined}
    , {value: 2, deleted: false, added: true, changed: 2}
    ]
  )
  t.deepEqual(
    compareLists(false)(['a'], ['a']),
    [ {value: 'a', deleted: false, added: false, changed: 'a'}
    ]
  )
  t.deepEqual(
    compareLists(false)([{a:1}], [{b:2}]),
    [ {value: {a:1}, deleted: true, added: false, changed: undefined}
    , {value: {b:2}, deleted: false, added: true, changed: {b:2}}
    ]
  )
  t.deepEqual(
    compareLists(false)([{id:5, a:1}], [{id:6, a:2}]),
    [ {value: {id:5, a:1}, deleted: true, added: false, changed: undefined}
    , {value: {id:6, a:2}, deleted: false, added: true, changed: {id:6, a:2}}
    ]
  )
  t.deepEqual(
    compareLists(false)([{id:5, a:1}], [{id:5, a:1}]),
    [{value: {id:5, a:1}, deleted: false, added: false, changed: {id:5, a:1}}]
  )
  t.deepEqual(
    compareLists(false)([{id:5, a:1}], [{id:5, a:2}]),
    [{value: {id:5, a:1}, deleted: false, added: false, changed: {id:5, a:2}}]
  )
  t.deepEqual(
    compareLists(false)([{id:5, a:2}], [{id:5, a:1}]),
    [{value: {id:5, a:2}, deleted: false, added: false, changed: {id:5, a:1}}]
  )
})

test('compareLists(diffInside = true)', t => {
  t.plan(8)

  t.deepEqual(
    compareLists(true)([1], [2]),
    [ {value: 1, deleted: false, added: false, changed: 2}
    ]
  )
  t.deepEqual(
    compareLists(true)(['a'], ['a']),
    [ {value: 'a', deleted: false, added: false, changed: 'a'}
    ]
  )
  t.deepEqual(
    compareLists(true)(['b'], ['a']),
    [ {value: 'b', deleted: false, added: false, changed: 'a'}
    ]
  )
  t.deepEqual(
    compareLists(true)([{a:1}], [{b:2}]),
    [ {value: {a:1}, deleted: false, added: false, changed: {b:2}}
    ]
  )
  t.deepEqual(
    compareLists(true)([{id:5, a:1}], [{id:6, a:2}]),
    [ {value: {id:5, a:1}, deleted: true, added: false, changed: undefined}
    , {value: {id:6, a:2}, deleted: false, added: true, changed: {id:6, a:2}}
    ]
  )
  t.deepEqual(
    compareLists(true)([{id:5, a:1}], [{id:5, a:1}]),
    [{value: {id:5, a:1}, deleted: false, added: false, changed: {id:5, a:1}}]
  )
  t.deepEqual(
    compareLists(true)([{id:5, a:1}], [{id:5, a:2}]),
    [{value: {id:5, a:1}, deleted: false, added: false, changed: {id:5, a:2}}]
  )
  t.deepEqual(
    compareLists(true)([{id:5, a:2}], [{id:5, a:1}]),
    [{value: {id:5, a:2}, deleted: false, added: false, changed: {id:5, a:1}}]
  )
})

