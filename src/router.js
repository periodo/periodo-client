"use strict";

const url = require('url')
    , resources = require('./modules').getApplicationResources()

let resourceMap

function match(path) {
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
  if (!resourceMap) {
    resourceMap = {}

    resources.forEach(r => {
      resourceMap[r.name] = r.route;
    })
  }

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


module.exports = {
  match,
  reverse,
}
