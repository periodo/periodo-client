"use strict";

const { Util } = require('n3')
    , ns = require('lov-ns')

const prefixes = {
  skos: ns.skos,
  dc: ns.dcterms,
  foaf: ns.foaf,
  time: ns.time,
  xsd: ns.xsd,
  owl: ns.owl,
  bibo: ns.bibo,
  rdfs: ns.rdfs,
  periodo: 'http://n2t.net/ark:/99152/p0v#',
}

function prefixExpander(prefixes) {
  const n3fn = Util.prefixes(prefixes)

  return arg => {
    const colonPos = arg.indexOf(':')

    return colonPos > -1
      ? n3fn(arg.slice(0, colonPos))(arg.slice(colonPos + 1))
      : n3fn(arg)
  }
}

module.exports = Object.assign(prefixExpander(prefixes), {
  prefixes,
  withPrefixes(extra) {
    return prefixExpander(Object.assign({}, prefixes, extra))
  }
})
