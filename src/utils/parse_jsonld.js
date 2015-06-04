"use strict"

var jsonld = require('jsonld')
  , parseRDF = require('./parse_rdf')

module.exports = function (doc) {
  if (typeof doc === 'string') doc = JSON.parse(doc);

  return new Promise((resolve, reject) => {
    jsonld.toRDF(doc, { format: 'application/nquads' }, function (err, nquads) {
      if (err) reject(err);

      parseRDF(nquads).then(resolve, reject);
    });
  });
}
