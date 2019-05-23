"use strict";

const R = require('ramda')
    , { Util } = require('n3')
    , { makeTypedAction, getResponse } = require('org-async-actions')
    , N3 = require('n3')
    , isURL = require('is-url')
    , makeSourceRepr = require('./utils/make_source_repr')
    , { getGraphSubject } = require('./utils/source_ld_match')
    , ns = require('./ns')
    , jsonldToStore = require('./utils/parse_jsonld')
    , { rdfToStore } = require('org-n3-utils')

const CORS_PROXY = 'https://ptgolden.org/cors-anywhere/'

// TODO: Remove concept of prefixes. Just rely on our own prefixes defined
// ahead of time. We should only abbreviate what we expect, anyway.

const LinkedDataAction = module.exports = makeTypedAction({
  FetchLinkedData: {
    exec: fetchLinkedData,
    request: {
      url: isURL,
      opts: Object,
    },
    response: {
      store: Object,
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

  FetchSource: {
    exec: fetchSource,
    request: {
      url: isURL,
      opts: Object,
    },
    response: {
      source: Object,
    }
  },

  ClearLinkedDataCache: {
    exec: clearLinkedDataCache,
    request: {},
    response: {},
  },
})

async function _fetchLinkedData(url, type="text/turtle") {
  // TODO: Validate the type here... or base it off of the extension on the URL
  const parser = type === 'application/json+ld' ? jsonldToStore : rdfToStore

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
      , { store, prefixes={} } = await parser(text)

  return { store, prefixes }
}

function fetchLinkedData(url, opts={}) {
  return async (dispatch, getState, { db }) => {
    const {
      tryCache=false,
      populateCache=false,
      resourceMimeType='text/turtle'
    } = opts

    let store

    // TODO: Add cache invalidation
    // FIXME: This is just a plain object- not n3 terms. This might be better
    // fixed in the database itself
    if (tryCache) {
      const obj = await db.linkedDataCache.get(url)

      if (obj) {
        const { quads } = obj

        store = new N3.Store()
        store.addQuads(quads)
      }
    }

    if (!store) {
      store = (await _fetchLinkedData(url, resourceMimeType)).store

      if (populateCache) {
        await db.linkedDataCache.put({
          url,
          quads: store.getQuads().map(quad => {
            ['subject', 'object'].forEach(part => {
              const term = quad[part]
              if (term.termType === 'BlankNode') {
                term.value = ''
              }
            })
          }),
        })
      }
    }

    return { store, prefixes: {} }
  }
}

function fetchORCIDs(orcids, opts) {
  return async (dispatch) => {
    const pairs = await Promise.all(orcids.map(async orcid => {
      if (orcid.startsWith('http://')) {
        orcid = 'https' + orcid.slice(4)
      }

      const req = dispatch(LinkedDataAction.FetchLinkedData(orcid, Object.assign({
        tryCache: true,
        populateCache: true
      }, opts)))

      const { store } = getResponse(req)

      let [ label ] = store.getQuads(orcid, ns('rdfs')('label'))

      label = (label && Util.isLiteral(label.object))
        ? label.object.value
        : orcid

      return [ orcid, label ]
    }))

    return R.fromPairs(pairs)
  }
}

function fetchSource(url, opts) {
  return async dispatch => {
    const req = await dispatch(LinkedDataAction.FetchLinkedData(url, Object.assign({
      tryCache: false,
      populateCache: true,
    }, opts)))

    const { store } = getResponse(req)
        , source = makeSourceRepr(store, getGraphSubject(url))

    return { source }
  }
}

function clearLinkedDataCache() {
  return async (dispatch, getState, { db }) => {
    await db.linkedDataCache.clear()
    return {}
  }
}
