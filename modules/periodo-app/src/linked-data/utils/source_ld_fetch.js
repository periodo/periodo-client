"use strict";

const N3Store = require('n3/lib/N3Store')
    , fetchLinkedData = require('../fetch')
    , makeSourceRepr = require('./make_source_repr')

module.exports = async function fetchLinkedDataSource(uri, opts={ tryCache: false }) {
  const store = N3Store()

  const { triples, prefixes } = await fetchLinkedData(uri, opts)

  store.addPrefixes(prefixes);
  store.addTriples(triples);

  return makeSourceRepr(store, uri)
}
