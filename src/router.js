"use strict";

const qs = require('querystring')
    , url = require('url')

let resources
  , resourceMap

function populate() {
  if (!resources) {
    resources = require('./modules').getApplicationResources()
  }

  if (!resourceMap) {
    resourceMap = {}

    resources.forEach(r => {
      resourceMap[r.name] = r.route;
    })
  }
}

function match(path) {
  populate();

  const { pathname, query } = url.parse(path)

  for (const routeDef of resources) {
    const { route, onBeforeRoute, Component } = routeDef
        , _match = route.match(pathname)

    if (_match) {
      return {
        params: _match,
        queryParams: query,
        onBeforeRoute,
        Component,
      }
    }
  }

  return null;
}


function reverse(name, params) {
  populate();

  const route = resourceMap[name]

  if (!route) {
    throw new Error(`No route with name ${name}`)
  }

  const url = route.reverse(params)

  if (!url) {
    throw new Error(`Could not generate route for ${name} with params ${JSON.stringify(params)}.`)
  }

  return url
}


function generateRoute(routeName, params, queryParams) {
  const escapedParams = {}
      , escapedQueryParams = {}

  Object.keys(params || {}).forEach(k => {
    escapedParams[k] = encodeURIComponent(params[k])
  })

  Object.keys(queryParams || {}).forEach(k => {
    escapedQueryParams[k] = encodeURIComponent(queryParams[k])
  })

  let path = '#' + reverse(routeName, escapedParams)

  if (queryParams) {
    path += '?' + qs.encode(queryParams)
  }

  return path
}


module.exports = {
  match,
  reverse,
  generateRoute,
}
