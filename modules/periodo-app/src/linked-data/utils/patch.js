"use strict";

const R = require('ramda')
    , N3 = require('n3')
    , ns = require('../ns')

function patchAgentsByRole(store, url) {
  return R.pipe(
    () => store.getObjects(url, ns('prov:qualifiedAssociation')),
    R.groupBy(association => store.getObjects(association, ns('prov:hadRole'))[0].id.split('#')[1] + 'By'),
    R.map(([ association ]) =>
      store.getObjects(association, ns('prov:agent'))
        .map(x => x.id.replace('http://', 'https://'))),

    // TODO: Possibly take this out. Can there be more than one agent assigned
    // to a role? Probably not for submitting and merging, but maybe for
    // updating?
    R.map(R.head)
  )()
}

function getPatchRepr(store, url) {
  const used = store.getObjects(url, ns('prov:used'))

  const [ patchResourceURL, sourceDatasetURL ] =
    used[0].id.includes('patch') ? used : used.reverse()

  const [ patchURL ] = store.getObjects(patchResourceURL, ns('foaf:page'))

  const time = store.getObjects(url, ns('prov:startedAtTime'))[0].value

  const agentsByRole = patchAgentsByRole(store, url)

  return Object.assign({
    url: url.id,
    patchURL: patchURL.id,
    sourceDatasetURL: sourceDatasetURL.id,
    time: new Date(time),
  }, agentsByRole)
}

module.exports = {
  getPatchRepr,
}
