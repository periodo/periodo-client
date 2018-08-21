"use strict";

const test = require('blue-tape')
    , N3 = require('n3')
    , ns = require('../ns')
    , makeSourceRepr = require('../utils/make_source_repr')

test('Generating a textual representation of a graph with a document', async t => {
  const store = N3.Store()

  const expand = ns.withPrefixes({
    '': 'http://example.com/'
  })

  store.addQuad(
    expand(':source'),
    expand('dc:title'),
    '"Computation and Human Experience"')

  store.addQuad(
    expand(':source'),
    expand(':irrelevant'),
    expand(':statement'))

  t.deepEqual(makeSourceRepr(store, expand(':source')), {
    id: 'http://example.com/source',
    title: 'Computation and Human Experience',
  })

  store.addQuad(
    expand(':source'),
    expand('dc:creator'),
    expand(':auth1'))

  store.addQuad(
    expand(':auth1'),
    expand('foaf:name'),
    '"Philip Agre"')

  t.deepEqual(makeSourceRepr(store, expand(':source')), {
    id: expand(':source').id,
    title: 'Computation and Human Experience',
    creators: [
      {
        id: expand(':auth1').id,
        name: 'Philip Agre'
      }
    ]
  })
})
