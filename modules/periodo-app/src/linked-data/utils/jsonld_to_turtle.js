"use strict";

const jsonld = require('jsonld')
    , ns = require('../ns')
    , N3 = require('n3')

module.exports = async function (jsonldData) {
  const store = N3.Store()
      , writer = N3.Writer({ prefixes: ns.prefixes })

  const quads = await jsonld.promises.toRDF(jsonldData)

  quads.forEach(quad => {
    ['subject', 'object'].forEach(part => {
      const term = quad[part]
      if (term.termType === 'BlankNode') {
        term.value = term.value.slice(2)
      }
    })
  })

  store.addQuads(quads)
  writer.addQuads(store.getQuads())

  return new Promise((resolve, reject) => {
    writer.end((err, result) => {
      if (err) reject(err);
      result = result
        .replace(/\n</g, '\n\n<')
        .replace(/(\n<.*?>) /g, "$1\n    ")

      resolve(result);
    });
  })
}
