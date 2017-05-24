"use strict";

const { getLiteralValue } = require('n3/lib/N3Util')


const sourceFields = new Map()
  .set('title', [
    'http://purl.org/dc/terms/title',
    'http://schema.org/name'
  ])
  .set('yearPublished', [
    'http://purl.org/dc/terms/date',
    'http://schema.org/datePublished'
  ])
  .set('creators', [
    'http://purl.org/dc/terms/creator',
    'http://schema.org/creator'
  ])
  .set('contributors', [
    'http://purl.org/dc/terms/contributor',
    'http://schema.org/contributor',
    'http://schema.org/editor'
  ])

const contributorFields = new Map()
  .set('name', [
    'http://xmlns.com/foaf/0.1/name',
    'http://schema.org/name'
  ])


/*
 * Parsers for worldcat and citeseer citations. Returns the following
 * attributes, if they exist:
 *   title, yearPublished, creators, contributors, and partOf
 */

// Given a store and a subject URI, iterate through the candidate predicate
// URIs, and return the triples of the first predicate which matches the pattern
// s-p-? in the store.
function getFirstMatch(store, subjectURI, predicateURIs) {
  for (const predicateURI of predicateURIs) {
    const match = store.find(subjectURI, predicateURI, null)
    if (match) return match;
  }

  return null;
}

function getFirstObjectLiteral(trips) {
  return getLiteralValue(trips[0].object)
}

module.exports = function makeSourceRepr(store, entity) {
  const source = { id: entity }
  
  ;[...sourceFields].forEach(([field, preds]) => {
    const triples = getFirstMatch(store, entity, preds)

    if (!triples) return;

    if (field !== 'creators' && field !== 'contributors') {
      source[field] = getFirstObjectLiteral(triples)
      return
    }

    const agents = triples.map(triple => {
      const agent = { id: triple.object }
          , nameTriples = getFirstMatch(agent.id, contributorFields.get('name'))

      if (nameTriples) {
        agent.name = getFirstObjectLiteral(nameTriples)
      }

      return agent;
    })

    source[field] = agents
  })

  return source;
}
