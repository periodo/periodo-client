"use strict";

const qs = require('querystring')
    , through = require('through2')
    , NotFound = require('./main/components/NotFound')

function createStream() {
  const resources = require('./modules').getApplicationResources()

  return through.obj(async (path, enc, cb) => {
    if (path[0] === '#') path = path.slice(1)
    if (path[0] === '/') path = path.slice(1)

    const [ resourceName, encodedParams='' ] = path.split('?')
        , params = qs.parse(encodedParams)

    const resource = resources[resourceName] || {
      Component: NotFound
    }

    cb(null, Object.assign({ params }, resource))
  })
}

function generateRoute(resourceName, params) {
  const query = qs.encode(params)

  let url = '#' + resourceName

  if (query) {
    url = url + '?' + query
  }

  return url
}

module.exports = {
  createStream,
  generateRoute,
}
