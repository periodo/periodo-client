"use strict";

const R = require('ramda')
    , doi = require('identifiers-doi')
    , Type = require('union-type')

const worldcatUrlRegex = /worldcat.org\/(?:[a-z]+\/)?(?:oclc|title)\/(\d+).*/i

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


function isLinkedData(source) {
  return !!match(R.path([ 'id' ], source)) || !!match(R.path([ 'partOf', 'id' ], source) || '');
}


// Identifier -> String
function asURL(identifier) {
  return identifier.case({
    //Worldcat: id => `https://www.worldcat.org/oclc/${id}`,
    Worldcat: id => `http://experiment.worldcat.org/oclc/${id}.ttl`,
    Crossref: doi => `https://doi.org/${doi}`,
  })
}

function getGraphSubject(url) {
  const identifier = match(url)

  if (!identifier) return null

  return identifier.case({
    Worldcat: id => `http://www.worldcat.org/oclc/${id}`,
    Crossref: doi => `http://dx.doi.org/${doi}`,
  })
}

module.exports = {
  match,
  asURL,
  getGraphSubject,
  isLinkedData,
}
