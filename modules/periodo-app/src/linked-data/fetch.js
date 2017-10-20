"use strict";

const formatURL = require('./utils/format_url')

async function _fetchLinkedData(url, type="text/turtle") {
  // TODO: Validate the type here... or base it off of the extension on the URL
  const parser = type === 'application/json+ld'
    ? require('./utils/parse_jsonld')
    : require('./utils/parse_rdf')

  const resp = await fetch(formatURL(url), {
    mode: 'cors',
    headers: { Accept: type }
  })

  if (!resp.ok) {
    const err = new Error(`Could not fetch ${resp.url} (${resp.status}):\n\n${resp.statusText}`);
    err.resp = resp;
    throw err;
  }

  const text = await resp.text()
      , { triples, prefixes } = await parser(text)

  return { triples, prefixes }
}

module.exports = async function fetchLinkedData(db, url, opts={}) {
  const {
    tryCache=false,
    populateCache=false,
    resourceMimeType='text/turtle'
  } = opts

  let resource

  // TODO: Add cache invalidation
  if (tryCache) {
    resource = await db.linkedDataCache.get(url)
  }

  if (!resource) {
    resource = await _fetchLinkedData(url, resourceMimeType)
    resource = {
      url,
      triples: resource.triples,
    }
    if (populateCache) {
      await db.linkedDataCache.put(resource)
    }
  }

  return resource;
}
