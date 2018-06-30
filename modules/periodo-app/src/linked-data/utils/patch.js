"use strict";

const R = require('ramda')
    , N3 = require('n3')
    , ns = require('lov-ns')

function patchAgentsByRole(store, url) {
  return R.pipe(
    () => store.getObjects(url, `${ns.prov}qualifiedAssociation`),
    R.groupBy(assoc => store.getObjects(assoc, `${ns.prov}hadRole`)[0].split('#')[1] + 'By'),
    R.map(([assoc]) => R.map(
      R.replace('http://', 'https://'),
      store.getObjects(assoc, `${ns.prov}agent`)
    )),

    // TODO: Possibly take this out. Can there be more than one agent assigned
    // to a role? Probably not for submitting and merging, but maybe for
    // updating?
    R.map(R.head)
  )()
}

function getPatchRepr(store, url) {
  const used = store.getObjects(url, 'prov:used')

  const [ patchResourceURL, sourceDatasetURL ] =
    used[0].includes('patch') ? used : used.reverse()

  const [ patchURL ] = store.getObjects(patchResourceURL, 'foaf:page')

  const time = R.pipe(
    () => store.getObjects(url, 'prov:startedAtTime'),
    R.head,
    N3.Util.getLiteralValue,
  )()

  const agentsByRole = patchAgentsByRole(store, url)

  return Object.assign({
    url,
    patchURL,
    sourceDatasetURL,
    time,
  }, agentsByRole)
}

module.exports = {
  getPatchRepr,
}
