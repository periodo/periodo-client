"use strict";

global.RETHROW_ERRORS = true;

const test = require('blue-tape')
    , makeMockStore = require('../../store_mock')
    , { getResponse } = require('org-async-actions')
    , MainAction = require('../../main/actions')
    , LinkedDataAction = require('../actions')
    , ns = require('../ns')

async function createStore() {
  const store = makeMockStore()

  await store.dispatch(MainAction.InitIndexedDB)

  store.clearActions()

  return store
}

function mockFetch(body, contentType) {
  const requests = []

  const fetch = async (url, opts) => {
    requests.push({ url, opts })

    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': contentType },
    })
  }

  return { fetch, requests }
}

test('Fetching linked data as JSON-LD', async t => {
  const store = await createStore()
      , originalFetch = global.fetch
      , { fetch, requests } = mockFetch(JSON.stringify({
        '@id': 'http://example.com/person',
        'http://www.w3.org/2000/01/rdf-schema#label': 'A Person',
        'http://example.com/knows': {
          'http://www.w3.org/2000/01/rdf-schema#label': 'Someone',
        },
      }), 'application/ld+json')

  global.fetch = fetch

  try {
    const req = await store.dispatch(LinkedDataAction.FetchLinkedData(
      'http://example.com/person', {
        resourceMimeType: 'application/ld+json',
        populateCache: true,
      }))

    t.equal(
      requests[0].opts.headers.Accept,
      'application/ld+json',
      'should request JSON-LD')

    const { store: ldStore } = getResponse(req)

    const [ label ] = ldStore.getQuads(
      'http://example.com/person', ns('rdfs')('label'))

    t.equal(label.object.value, 'A Person', 'should parse JSON-LD into a store')

    t.equal(ldStore.size, 3, 'should include blank node statements')

    const cachedReq = await store.dispatch(LinkedDataAction.FetchLinkedData(
      'http://example.com/person', {
        resourceMimeType: 'application/ld+json',
        tryCache: true,
      }))

    t.equal(requests.length, 1, 'should not fetch again when cached')

    t.equal(
      getResponse(cachedReq).store.size,
      3,
      'should populate the cache with the parsed statements')
  } finally {
    global.fetch = originalFetch
  }
})
