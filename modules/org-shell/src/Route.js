"use strict";

const qs = require('querystring')
    , R = require('ramda')

function Route(resourceName, params, opts) {
  if (!(this instanceof Route)) return new Route(resourceName, params);

  this.resourceName = resourceName || '';
  this.params = params || {};
  this.opts = opts || {};
}

Route.fromPath = path => {
  if (path[0] === '?') path = path.slice(1)

  const [ params, opts ] = path.split('#')

  const parsedParams = qs.parse(params)
      , parsedOpts = qs.parse(opts)

  return new Route(
    parsedParams.page || '',
    R.omit(['page'], parsedParams),
    parsedOpts
  )
}

Route.prototype.asURL = function () {
  const params = qs.encode(this.params)
      , opts = qs.encode(this.opts)

  let url = '?page=' + this.resourceName

  if (params) url += `&${params}`
  if (opts) url += `#${opts}`

  return url
}

module.exports = Route;
