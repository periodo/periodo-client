"use strict";

var N3 = require('n3')

/*
 * Given a string of turtle text, returns a promise with an N3.Store containing
 * the resulting graph.
 */
module.exports = function (turtle) {
  var parser = N3.Parser()
    , store = N3.Store()

  return new Promise((resolve, reject) => {
    parser.parse(turtle, function (err, triple, prefixes) {
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
}
