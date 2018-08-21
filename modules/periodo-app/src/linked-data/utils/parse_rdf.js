"use strict";

const { Parser } = require('n3')

/*
 * Given a string of turtle, TriG, N-Triples, or N-Quads, returns a promise
 * that resolves with an object containing the resulting triples and prefixes.
 */
module.exports = function (rdf) {
  const parser = Parser()
      , quads = []

  return new Promise((resolve, reject) => {
    parser.parse(rdf, (err, quad, prefixes) => {
      if (err) {
        reject(err);
      } else if (quad) {
        quads.push(quad);
      } else {
        resolve({ quads, prefixes });
      }
    });
  });
}
