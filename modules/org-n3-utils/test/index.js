"use strict";

const test = require('blue-tape')
    , N3 = require('n3')
    , { namedNode } = N3.DataFactory
    , { rdfToStore, findOne, rdfListToArray } = require('../')

test('N3 Utils', async t => {
  const prefixes = N3.Util.prefixes({
    ex: 'http://example.com/',
  })

  const { store } = await rdfToStore(`
    @prefix ex: <http://example.com/> .

    ex:a ex:b ex:c .

    ex:list ex:members (
      ex:d
      ex:e
      ex:f
    ) .
  `)

  t.equal(store.size, 8, 'should parse an RDF string into an N3 Store')

  t.deepEqual(
    await findOne(store, prefixes('ex')('a')),
    N3.DataFactory.quad(
      namedNode('http://example.com/a'),
      namedNode('http://example.com/b'),
      namedNode('http://example.com/c'),
    ),
    'should be able to find one triple in a store'
  )

  const listHeadNode = (await findOne(
    store,
    prefixes('ex')('list'),
    prefixes('ex')('members'),
  )).object

  t.deepEqual(
    await rdfListToArray(store, listHeadNode),
    [
      namedNode('http://example.com/d'),
      namedNode('http://example.com/e'),
      namedNode('http://example.com/f'),
    ],
    'should convert RDF lists to JS arrays'
  )
})
