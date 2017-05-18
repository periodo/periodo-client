"use strict";

const url = require('url')
    , routes = require('../modules').getApplicationRoutes()

function match(path) {
  const { pathname, query } = url.parse(path)

  for (const handler of routes) {
    const { route } = handler
        , _match = route.match(pathname)

    if (_match) {
      return {
        pathname,
        params: _match,
        queryParams: query,
        matched: handler
      }
    }
  }

  return null;
}


module.exports = {
  match,

  // TODO: reverse,
}
