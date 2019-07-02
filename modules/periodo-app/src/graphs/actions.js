"use strict";

const R = require('ramda')
    , { makeTypedAction, getResponse } = require('org-async-actions')

const GraphsAction = module.exports = makeTypedAction({
  FetchGraphs: {
    exec: fetchGraphs,
    request: {
      path: String
    },
    response: {
      json: Object
    }
  },

  FetchGazetteers: {
    exec: fetchGazetteers,
    request: {},
    response: {
      gazetteers: Object
    }
  },
})

const graphURL = path => {
  const origin = (global.location
    && global.location.hostname.startsWith('client.'))
      ? global.location.origin.replace('client.', 'data.')
      : 'https://data.staging.perio.do' // assume we are testing if the origin
                                        // does not begin with 'client.'
  return `${origin}/graphs/${path}`
}

const indexFeatures = gazetteers => R.fromPairs(R.chain(
  gi => R.map(
    fi => {
      const path = [gi, 'features', fi]
      return [ R.path(path, gazetteers).id, path ]
    },
    R.range(0, gazetteers[gi].features.length)
  ),
  R.range(0, gazetteers.length)
))

function fetchGraphs(path) {
  return async () => {
    const resp = await fetch(graphURL(path), {
      mode: 'cors',
      headers: { Accept: 'application/json' }
    })

    if (!resp.ok) {
      const err = new Error(
        `Could not fetch ${resp.url} (${resp.status}):\n\n${resp.statusText}`)
      err.resp = resp
      throw err
    }

    return { json: await resp.json() }
  }
}

function fetchGazetteers() {
  return async dispatch => {
    const req = await dispatch(GraphsAction.FetchGraphs('places'))
    const { json } = getResponse(req)
    const gazetteers = Object.values(json.graphs)
    gazetteers.index = indexFeatures(gazetteers)
    return { gazetteers }
  }
}
