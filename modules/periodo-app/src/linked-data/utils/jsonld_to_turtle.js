"use strict";

const jsonld = require('jsonld')
    , ns = require('../ns')
    , { Parser, Writer, DataFactory } = require('n3')
    , N3 = require('n3')
    , parseRDF = require('./parse_rdf')

const PREFIXES = {
  skos: 'http://www.w3.org/2004/02/skos/core#',
  dcterms: 'http://purl.org/dc/terms/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  time: 'http://www.w3.org/2006/time#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  bibo: 'http://purl.org/ontology/bibo/',
  periodo: 'http://n2t.net/ark:/99152/p0v#'
}

function addPrefix(uri) {
  for (const prefix in PREFIXES) {
    const prefixedURI = PREFIXES[prefix]

    if (!PREFIXES.hasOwnProperty(prefix)) continue;

    if (uri.indexOf(prefixedURI) === 0) {
      return `${prefix}:${uri.replace(prefixedURI, '')}`
    }
  }

  return uri;
}

function processStatement(statement) {
  let val;

  if (statement.type !== 'literal') return statement.value;

  val = '"' + statement.value.replace(/"/g, '\\"') + '"';
  if (statement.datatype === 'http://www.w3.org/2001/XMLSchema#string') {
    // Good!
  } else if (statement.datatype === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
    val += '@' + statement.language;
  } else {
    val += '^^' + addPrefix(statement.datatype);
  }

  return val;
}

module.exports = async function (jsonldData) {
  const parser = Parser()
      , writer = Writer({ prefixes: ns.prefixes })

  const rdf = await jsonld.promises.toRDF(jsonldData, { format: 'application/nquads' })
      , { quads } = await parseRDF(rdf)

  writer.addQuads(quads)

  debugger;

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
