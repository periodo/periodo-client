"use strict";

const N3 = require('n3')
    , { makeTypedAction, getResponse } = require('org-async-actions')
    , { isURL } = require('periodo-utils/src/misc')
    , makeSourceRepr = require('./utils/make_source_repr')
    , { getGraphSubject } = require('./utils/source_ld_match')

const CORS_PROXY = 'https://ptgolden.org/cors-anywhere/'

const LinkedDataAction = module.exports = makeTypedAction({
  FetchLinkedData: {
    exec: fetchLinkedData,
    request: {
      url: isURL,
      opts: Object,
    },
    response: {
      triples: Array,
      prefixes: Object,
    }
  },
  FetchORCIDs: {
    exec: fetchORCIDs,
    request: {
      orcids: Array,
    },
    response: {
      nameByORCID: Object,
    }
  },
})

async function _fetchLinkedData(url, type="text/turtle") {
  // TODO: Validate the type here... or base it off of the extension on the URL
  const parser = type === 'application/json+ld'
    ? require('./utils/parse_jsonld')
    : require('./utils/parse_rdf')

  const resp = await fetch(CORS_PROXY + url, {
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

function fetchLinkedData(url, opts={}) {
  return async (dispatch, getState, { db }) => {
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
        prefixes: resource.prefixes,
      }
      if (populateCache) {
        await db.linkedDataCache.put(resource)
      }
    }

    return { triples: resource.triples, prefixes: resource.prefixes }
  }
}

function fetchORCIDs(orcids, opts) {
  return async (dispatch) => {
    const reqs = await Promise.all(orcids.map(url =>
      dispatch(LinkedDataAction.FetchLinkedData(url, Object.assign({
        tryCache: true,
        populateCache: true
      }, opts)))
    ))

    const store = N3.Store()

    reqs.map(getResponse).forEach(({ triples, prefixes }) => {
      store.addPrefixes(prefixes);
      store.addTriples(triples);
    })

    const nameByORCID = {}

    orcids.forEach(url => {
      if (url.startsWith('http://')) {
        url = 'https' + url.slice(4)
      }

      const [ literal ] = store.getObjects(url, 'rdfs:label')

      nameByORCID[url] = literal
        ? N3.Util.getLiteralValue(literal)
        : url
    })

    return { nameByORCID }
  }
}

function fetchSource(url, opts) {
  return async dispatch => {
    const store = N3.Store()

    const ldReq = await dispatch(fetchLinkedData(url, opts))
        , { triples, prefixes } = getResponse(ldReq)

    store.addPrefixes(prefixes);
    store.addTriples(triples);

    const source = makeSourceRepr(store, getGraphSubject(url))

    return { source }
  }
}
