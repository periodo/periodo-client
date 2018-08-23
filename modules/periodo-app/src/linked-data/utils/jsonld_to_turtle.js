"use strict";

const parseJSONLD = require('./parse_jsonld')
    , ns = require('../ns')
    , N3 = require('n3')

module.exports = async function (jsonldData) {
  const writer = N3.Writer({ prefixes: ns.prefixes })

  const { store } = await parseJSONLD(jsonldData)

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
