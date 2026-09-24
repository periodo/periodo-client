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
    , formatLDURL = require('./utils/format_url')
    , { parseToPromise } = require('org-n3-utils')

function createParser() {
  const blankNodePrefix = new Date().getTime() + '' + Math.random() + ':'

  return new N3.Parser({
    blankNodePrefix,
  })
}

const writer = new N3.Writer({ format: 'application/nquads' })


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
    },
  },

  FetchORCIDs: {
    exec: fetchORCIDs,
    request: {
      orcids: Array,
    },
    response: {
      infoByORCID: Object,
    },
  },

  FetchSource: {
    exec: fetchSource,
    request: {
      url: isURL,
      opts: Object,
    },
    response: {
      source: Object,
    },
  },

  ClearLinkedDataCache: {
    exec: clearLinkedDataCache,
    request: {},
    response: {},
  },
})

async function _fetchLinkedData(url, type="text/turtle") {
  // TODO: Validate the type here... or base it off of the extension on the URL
  const parser = type === 'application/json+ld'
    ? jsonldToStore
    : parseToPromise.bind(null, createParser())

  const resp = await fetch(formatLDURL(url), {
    mode: 'cors',
    headers: { Accept: type },
  })

  if (!resp.ok) {
    const err = new Error(`Could not fetch ${resp.url} (${resp.status}):\n\n${resp.statusText}`);
    err.resp = resp;
    throw err;
  }

  const text = await resp.text()
      , { quads, prefixes={}} = await parser(text)
      , store = new N3.Store()

  store.addQuads(quads)

  return {
    store,
    prefixes,
  }
}

function fetchLinkedData(url, opts={}) {
  const parser = createParser()

  return async (dispatch, getState, { db }) => {
    const {
      tryCache=false,
      populateCache=false,
      resourceMimeType='text/turtle',
    } = opts

    let store

    // TODO: Add cache invalidation
    if (tryCache) {
      const cached = await db.linkedDataCache.get(url)

      if (cached) {
        const { quads } = await parseToPromise(parser, cached.rdf)
        store = new N3.Store()
        store.addQuads(quads)
      }
    }

    if (!store) {
      const resp = (await _fetchLinkedData(url, resourceMimeType))

      store = resp.store

      if (populateCache) {
        const rdf = writer.quadsToString(store.getQuads())

        await db.linkedDataCache.put({
          url,
          rdf,
          date: new Date(),
        })
      }
    }

    return {
      store,
      prefixes: {},
    }
  }
}

// ORCID's RDF endpoint fails for some records whose JSON-LD is still
// available. The JSON-LD uses a remote schema.org context, so rather than
// processing it as RDF, read the name properties directly.
async function fetchORCIDNameFromJSONLD(orcid) {
  const resp = await fetch(formatLDURL(orcid), {
    mode: 'cors',
    headers: { Accept: 'application/ld+json' },
  })

  if (!resp.ok) {
    throw new Error(`Could not fetch ${resp.url} (${resp.status})`)
  }

  const { name, givenName, familyName } = await resp.json()

  if (typeof name === 'string' && name) return name

  return [ givenName, familyName ]
    .filter(x => typeof x === 'string' && x)
    .join(' ') || null
}

function fetchORCIDs(orcids, opts) {
  return async (dispatch) => {
    const pairs = await Promise.all(orcids.map(async orcid => {
      if (orcid.startsWith('http://')) {
        orcid = 'https' + orcid.slice(4)
      }

      let store

      // A failure to fetch one ORCID (e.g. an error from ORCID's RDF
      // endpoint) should not prevent the rest from loading; fall back to
      // getting the name from ORCID's JSON-LD, or else using the ORCID URL
      // as the label.
      try {
        const req = await dispatch(LinkedDataAction.FetchLinkedData(orcid, {
          tryCache: true,
          populateCache: true,
          ...opts,
        }))

        store = getResponse(req).store
      } catch (e) {
        let label

        try {
          label = await fetchORCIDNameFromJSONLD(orcid)
        } catch (e) {
          label = null
        }

        return [ orcid, {
          label: label || orcid,
          mbox: null,
        }]
      }

      let [ label ] = store.getQuads(orcid, ns('rdfs')('label'))

      label = (label && Util.isLiteral(label.object))
        ? label.object.value
        : orcid

      let [ mbox ] = store.getQuads(orcid, ns('foaf')('mbox'))

      mbox = (mbox && Util.isNamedNode(mbox.object))
        ? mbox.object.value
        : null

      return [ orcid, {
        label,
        mbox,
      }]
    }))

    return {
      infoByORCID: R.fromPairs(pairs),
    }
  }
}

function fetchSource(url, opts) {
  return async dispatch => {
    const req = await dispatch(LinkedDataAction.FetchLinkedData(url, {
      tryCache: false,
      populateCache: true,
      ...opts,
    }))

    req.readyState.case({
      Failure: err => {
        throw err;
      },
      _: () => null,
    })

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
