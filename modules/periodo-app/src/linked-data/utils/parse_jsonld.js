"use strict"

const N3 = require('n3')
    , jsonld = require('jsonld')

module.exports = async function (doc) {
  if (typeof doc === 'string') doc = JSON.parse(doc)

  const store = N3.Store()
      , quads = await jsonld.promises.toRDF(doc)

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

  store.addQuads(quads)

  return { store }
}
