"use strict";

const test = require('blue-tape')
    , N3 = require('n3')
    , ns = require('../ns')
    , makeSourceRepr = require('../utils/make_source_repr')

test('Generating a textual representation of a graph with a document', async t => {
  const store = N3.Store()

  store.addPrefixes(ns)

  store.addTriple(':source', ns.dc + 'title', '"Computation and Human Experience"')
  store.addTriple(':source', ':irrelevant', ':triple')

  t.deepEqual(makeSourceRepr(store, ':source'), {
    id: ':source',
    title: 'Computation and Human Experience',
  })

  store.addTriple(':source', ns.dc + 'creator', ':auth1')
  store.addTriple(':auth1', ns.foaf + 'name', '"Philip Agre"')

  t.deepEqual(makeSourceRepr(store, ':source'), {
    id: ':source',
    title: 'Computation and Human Experience',
    creators: [
      {
        id: ':auth1',
        name: 'Philip Agre'
      }
    ]
  })
})
