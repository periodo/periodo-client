"use strict";

var N3 = require('n3')

/*
 * Given a string of turtle, TriG, N-Triples, or N-Quads, returns a promise
 * that resolves with an object containing the resulting triples and prefixes.
 */
module.exports = function (rdf) {
  var parser = N3.Parser()
    , triples = []

  return new Promise((resolve, reject) => {
    parser.parse(rdf, function (err, triple, prefixes) {
      if (err) {
        reject(err);
      } else if (triple) {
        triples.push(triple);
      } else {
        resolve({ triples, prefixes });
      }
    });
  });
}
