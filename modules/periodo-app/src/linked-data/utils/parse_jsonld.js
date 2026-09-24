"use strict"

const N3 = require('n3')
    , jsonld = require('jsonld')

module.exports = async function (doc) {
  if (typeof doc === 'string') doc = JSON.parse(doc)

  const quads = await jsonld.promises.toRDF(doc)

  const replacements = {}

  quads.forEach(quad => {
    Object.values(quad).forEach(term => {
      if (term.termType === 'BlankNode') {
        term.value = term.value in replacements
          ? replacements[term.value]
          : (replacements[term.value] = N3.DataFactory.blankNode().id.slice(2))
      }
    })
  })

  // Normalize to N3 terms, as returned by the N3 parser. (jsonld's quads
  // lack a `Quad` termType, so N3.DataFactory.fromQuad rejects them.)
  const { quad, fromTerm } = N3.DataFactory

  return {
    quads: quads.map(q => quad(
      fromTerm(q.subject),
      fromTerm(q.predicate),
      fromTerm(q.object),
      fromTerm(q.graph)
    )),
  }
}
