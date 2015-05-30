"use strict"

var N3 = require('n3')
  , jsonld = require('jsonld')

module.exports = function (doc) {
  var parser = N3.Parser()
    , store = N3.Store()

  if (typeof doc === 'string') doc = JSON.parse(doc);

  return new Promise((resolve, reject) => {
    jsonld.toRDF(doc, {format: 'application/nquads'}, function (err, nquads) {
      if (err) reject(err);

      parser.parse(nquads, function (err, triple, prefixes) {
        if (err) {
          reject(err);
        } else if (triple) {
          store.addTriple(triple);
        } else {
          store.addPrefixes(prefixes);
          resolve(store);
        }
      });
    });
  });
}
