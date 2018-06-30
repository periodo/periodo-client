"use strict";

const ns = require('lov-ns')

function findOne(store, s, p, o) {
  let ret = null

  return store.some(statement => ret = statement, s, p, o), ret;
}

function rdfListToArray(store, headNode) {
  const arr = []

  let _headNode = headNode

  while (_headNode !== `${ns.rdf}nil`) {
    const el = findOne(store, _headNode, `${ns.rdf}first`)

    if (!el) {
      throw new Error(`No triple matching ${_headNode} rdf:first ?`)
    }

    arr.push(el.object)

    _headNode = findOne(store, _headNode, `${ns.rdf}rest`);

    if (!_headNode) {
      throw new Error(`No triple matching ${_headNode} rdf:rest ?`)
    }

    _headNode = _headNode.object
  }

  return arr;
}

module.exports = {
  findOne,
  rdfListToArray,
}
