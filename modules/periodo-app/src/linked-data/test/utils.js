"use strict";

const test = require('blue-tape')
    , N3 = require('n3')
    , utils = require('../utils')

test('N3 Utils', async t => {
  const store = N3.Store()

  store.addPrefixes({
    ex: 'http://example.com/',
  })

  const { triples } = await utils.parseRDF(`
  @prefix ex: <http://example.com/> .

  ex:a ex:b ex:c .

  ex:list ex:members (
    ex:d
    ex:e
    ex:f
  ) .
  `)

  store.addTriples(triples)

  t.deepEqual(
    await utils.n3.findOne(store, 'ex:a'),
    {
      subject: 'http://example.com/a',
      predicate: 'http://example.com/b',
      object: 'http://example.com/c',
      graph: '',
    },
    'should be able to find one triple in a store'
  )

  const listHeadNode = (await utils.n3.findOne(store, 'ex:list', 'ex:members')).object

  t.deepEqual(
    await utils.n3.rdfListToArray(store, listHeadNode),
    [
      'http://example.com/d',
      'http://example.com/e',
      'http://example.com/f',
    ],
    'should convert RDF lists to JS arrays'
  )
})
