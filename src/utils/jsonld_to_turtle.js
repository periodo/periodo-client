"use strict";

var jsonld = require('jsonld')
  , N3 = require('n3')

function processStatement(statement) {
  var val;

  if (statement.type !== 'literal') return statement.value;

  val = '"' + statement.value.replace(/"/g, '\\"') + '"';
  if (statement.datatype === 'http://www.w3.org/2001/XMLSchema#string') {
    // Good!
  } else if (statement.datatype === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
    val += '@' + statement.language;
  } else {
    val += '^^' + statement.datatype;
  }

  return val;
}

module.exports = function (jsonldData) {
  return new Promise((resolve, reject) => {
    jsonld.toRDF(jsonldData, (err, dataset) => {
      var writer

      if (err) reject(err);

      writer = N3.Writer({
        skos: 'http://www.w3.org/2004/02/skos/core#',
        dcterms: 'http://purl.org/dc/terms/',
        foaf: 'http://xmlns.com/foaf/0.1/',
        time: 'http://www.w3.org/2006/time#',
        xsd: 'http://www.w3.org/2001/XMLSchema#',
        owl: 'http://www.w3.org/2002/07/owl#',
        bibo: 'http://purl.org/ontology/bibo/',
        periodo: 'http://n2t.net/ark:/99152/p0v#'
      });

      dataset['@default'].forEach(triple => writer.addTriple({
        subject: processStatement(triple.subject),
        predicate: processStatement(triple.predicate),
        object: processStatement(triple.object)
      }));

      writer.end((err, result) => {
        if (err) reject(err);
        result = result
          .replace(/\n</g, '\n\n<')
          .replace(/(\n<.*?>) /g, "$1\n    ")

        resolve(result);
      });
    });
  });
}
