"use strict";

const ns = require('lov-ns')
    , { nsExpander } = require('org-n3-utils')


module.exports = nsExpander({
  skos: ns.skos,
  dc: ns.dcterms,
  foaf: ns.foaf,
  time: ns.time,
  xsd: ns.xsd,
  owl: ns.owl,
  bibo: ns.bibo,
  rdfs: ns.rdfs,
  prov: ns.prov,
  periodo: 'http://n2t.net/ark:/99152/p0v#',
})
