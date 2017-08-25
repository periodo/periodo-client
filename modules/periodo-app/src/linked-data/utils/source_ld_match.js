"use strict";

const doi = require('identifiers-doi')
    , Type = require('union-type')
    , N3Store = require('n3/lib/N3Store')
    , fetchLinkedData = require('../fetch')
    , makeSourceRepr = require('./make_source_repr')

const worldcatUrlRegex = /worldcat.org\/.*?oclc\/(\d+).*/i

const Identifier = Type({
  Worldcat: {
    id: String,
  },

  Crossref: {
    doi: String,
  },
})

// String -> Identifier | null
function match(text='') {
  const worldcatMatch = text.match(worldcatUrlRegex)

  if (worldcatMatch) {
    return Identifier.Worldcat(worldcatMatch[1])
  }

  const dois = doi.extract(text)

  if (dois.length) {
    return Identifier.Crossref(dois[0])
  }

  return null
}

// Identifier -> String
function asURL(identifier) {
  return identifier.case({
    //Worldcat: id => `https://www.worldcat.org/oclc/${id}`,
    Worldcat: id => `http://experiment.worldcat.org/oclc/${id}.ttl`,
    Crossref: doi => `https://data.crossref.org/${doi}`,
  })
}

function getGraphSubject(identifier) {
  return identifier.case({
    Worldcat: id => `http://www.worldcat.org/oclc/${id}`,
    Crossref: doi => `http://dx.doi.org/${doi}`,
  })
}

async function fetchLD(identifier, opts={ tryCache: false }) {
  const store = N3Store()

  const { triples, prefixes } = await fetchLinkedData(asURL(identifier), opts)

  store.addPrefixes(prefixes);
  store.addTriples(triples);

  return makeSourceRepr(store, getGraphSubject(identifier))
}

module.exports = {
  match,
  asURL,
  fetchLD,
}
