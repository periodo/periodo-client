"use strict";

const test = require('blue-tape')
    , N3 = require('n3')
    , utils = require('../utils')
    , { quad, namedNode } = N3.DataFactory

test('N3 Utils', async t => {
  const store = N3.Store()

  const prefixes = N3.Util.prefixes({
    ex: 'http://example.com/',
  })

  const { quads } = await utils.parseRDF(`
  @prefix ex: <http://example.com/> .

  ex:a ex:b ex:c .

  ex:list ex:members (
    ex:d
    ex:e
    ex:f
  ) .
  `)

  store.addQuads(quads)

  t.deepEqual(
    await utils.n3.findOne(store, prefixes('ex')('a')),
    N3.DataFactory.quad(
      namedNode('http://example.com/a'),
      namedNode('http://example.com/b'),
      namedNode('http://example.com/c'),
    ),
    'should be able to find one triple in a store'
  )

  const listHeadNode = (await utils.n3.findOne(
    store,
    prefixes('ex')('list'),
    prefixes('ex')('members'),
  )).object

  t.deepEqual(
    await utils.n3.rdfListToArray(store, listHeadNode),
    [
      namedNode('http://example.com/d'),
      namedNode('http://example.com/e'),
      namedNode('http://example.com/f'),
    ],
    'should convert RDF lists to JS arrays'
  )
})
