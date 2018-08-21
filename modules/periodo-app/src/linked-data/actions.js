"use strict";

const { Util, Store } = require('n3')
    , { makeTypedAction, getResponse } = require('org-async-actions')
    , isURL = require('is-url')
    , makeSourceRepr = require('./utils/make_source_repr')
    , { getGraphSubject } = require('./utils/source_ld_match')
    , ns = require('./ns')

const CORS_PROXY = 'https://ptgolden.org/cors-anywhere/'

const LinkedDataAction = module.exports = makeTypedAction({
  FetchLinkedData: {
    exec: fetchLinkedData,
    request: {
      url: isURL,
      opts: Object,
    },
    response: {
      quads: Array,
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

  ClearLinkedDataCache: {
    exec: clearLinkedDataCache,
    request: {},
    response: {},
  }
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
      , { quads, prefixes } = await parser(text)

  return { quads, prefixes }
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
    // FIXME: This is just a plain object- not n3 terms. This might be better
    // fixed in the database itself
    if (tryCache) {
      resource = await db.linkedDataCache.get(url)
    }

    if (!resource) {
      resource = await _fetchLinkedData(url, resourceMimeType)
      resource = {
        url,
        quads: resource.quads,
        prefixes: resource.prefixes,
      }
      if (populateCache) {
        await db.linkedDataCache.put(resource)
      }
    }

    return { quads: resource.quads, prefixes: resource.prefixes }
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

    const store = Store()

    reqs
      .map(getResponse)
      .forEach(({ quads }) => store.addQuads(quads))

    return orcids.reduce((acc, orcid) => {
      if (orcid.startsWith('http://')) {
        orcid = 'https' + orcid.slice(4)
      }

      const [ label ] = store.getQuads(orcid, ns('rdfs')('label'))

      return Object.assign({}, acc, {
        [orcid]: (label && Util.isLiteral(label.object))
          ? label.object.value
          : orcid
      })
    }, {})
  }
}

function fetchSource(url, opts) {
  return async dispatch => {
    const store = Store()

    const ldReq = await dispatch(fetchLinkedData(url, opts))
        , { quads } = getResponse(ldReq)

    store.addQuads(quads);

    const source = makeSourceRepr(store, getGraphSubject(url))

    return { source }
  }
}

function clearLinkedDataCache() {
  return async (dispatch, getState, { db }) => {
    await db.linkedDataCache.clear()
    return {}
  }
}
