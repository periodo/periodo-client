"use strict";

const N3 = require('n3')
    , { namedNode } = N3.DataFactory

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
    , rdfNil = namedNode(RDF + 'nil')
    , rdfFirst = namedNode(RDF + 'first')
    , rdfRest = namedNode(RDF + 'rest')

async function rdfToStore(rdfString) {
  const parser = N3.Parser()
      , store = N3.Store()

  return new Promise((resolve, reject) => {
    parser.parse(rdfString, (err, quad, prefixes) => {
      if (err) {
        reject(err);
      } else if (quad) {
        store.addQuad(quad);
      } else {
        resolve({ store, prefixes });
      }
    })
  })
}

function findOne(store, s, p, o) {
  let ret = null

  return store.some(statement => ret = statement, s, p, o), ret;
}

function rdfListToArray(store, headNode) {
  const arr = []

  let _headNode = headNode

  while (!rdfNil.equals(_headNode)) {
    const el = findOne(store, _headNode, rdfFirst)

    if (!el) {
      throw new Error(`No triple matching ${JSON.stringify(_headNode)} rdf:first ?`)
    }

    arr.push(el.object)

    _headNode = findOne(store, _headNode, rdfRest)

    if (!_headNode) {
      throw new Error(`No triple matching ${_headNode} rdf:rest ?`)
    }

    _headNode = _headNode.object
  }

  return arr;
}

module.exports = {
  rdfToStore,
  findOne,
  rdfListToArray,
}
