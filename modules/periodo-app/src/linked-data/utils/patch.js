"use strict";

const R = require('ramda')
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

  const submitTime = store.getObjects(url, ns('prov:startedAtTime'))[0].value
      , mergeTime = store.getObjects(url, ns('prov:endedAtTime'))[0].value

  const agentsByRole = patchAgentsByRole(store, url)

  // FIXME: This assumes that only the patch request will be given as the object
  // of seeAlso. It would be better if there were a PatchRequest class that the
  // patch request node could be an instance of
  const [ patchRequestURL ] = store.getObjects(url, ns('rdfs:seeAlso'))
      , [ repliesURL ] = store.getObjects(patchRequestURL, ns('activity:replies'))

  let numComments = 0
    , firstComment = null

  if (repliesURL) {
    const [ numCommentsNode ] = store.getObjects(repliesURL, ns('activity:totalItems'))
        , [ firstCommentURL ] = store.getObjects(repliesURL, ns('activity:first'))
        , [ firstCommentNode ] = store.getObjects(firstCommentURL, ns('activity:content'))

    numComments = parseInt(numCommentsNode.value)
    firstComment = firstCommentNode.value
  }

  return Object.assign({
    url: url.id,
    patchURL: patchURL.id,
    numComments,
    firstComment,
    patchRequestURL: patchRequestURL.id,
    sourceDatasetURL: sourceDatasetURL.id,
    submitTime: new Date(submitTime),
    mergeTime: new Date(mergeTime),
  }, agentsByRole)
}

module.exports = {
  getPatchRepr,
}
