"use strict";

const ns = require('../ns')

const expand = ns.withPrefixes({
  schema: 'http://schema.org/',
})


const sourceFields = {
  title: [
    expand('dc:title'),
    expand('schema:name'),
  ],
  yearPublished: [
    expand('dc:date'),
    expand('schema:datePublished'),
  ],
  creators: [
    expand('dc:creator'),
    expand('schema:creator'),
  ],
  contributors: [
    expand('dc:contributor'),
    expand('schema:contributor'),
    expand('schema:editor'),
  ],
}

const contributorFields = {
  name: [
    expand('foaf:name'),
    expand('schema:name'),
  ],
}


/*
 * Parsers for worldcat and citeseer citations. Returns the following
 * attributes, if they exist:
 *   title, yearPublished, creators, contributors, and partOf
 */

// Given a store and a subject URI, iterate through the candidate predicate
// URIs, and return the triples of the first predicate which matches the pattern
// s-p-? in the store.
function matchFromPredicateList(store, subject, predicates) {
  for (const predicate of predicates) {
    const match = store.getQuads(subject, predicate)

    if (match.length) return match
  }

  return null;
}

module.exports = function makeSourceRepr(store, sourceNode) {
  const source = { id: sourceNode }

  Object.entries(sourceFields).forEach(([ field, preds ]) => {
    const quads = matchFromPredicateList(store, sourceNode, preds)

    if (!quads) return;

    if (field !== 'creators' && field !== 'contributors') {
      source[field] = quads[0].object.value
      return
    }

    const agents = quads.map(quad => {
      const agent = { id: quad.object.id }

      const nameQuads = matchFromPredicateList(
        store,
        quad.object,
        contributorFields.name
      )

      if (nameQuads) {
        agent.name = nameQuads[0].object.value
      }

      return agent;
    })

    source[field] = agents
  })

  return source;
}
