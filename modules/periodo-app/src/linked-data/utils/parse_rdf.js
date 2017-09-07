"use strict";

const N3Parser = require('n3/lib/N3Parser')

/*
 * Given a string of turtle, TriG, N-Triples, or N-Quads, returns a promise
 * that resolves with an object containing the resulting triples and prefixes.
 */
module.exports = function (rdf) {
  const parser = N3Parser()
      , triples = []

  return new Promise((resolve, reject) => {
    parser.parse(rdf, (err, triple, prefixes) => {
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
