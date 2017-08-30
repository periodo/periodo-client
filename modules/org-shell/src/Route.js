"use strict";

const qs = require('querystring')
    , R = require('ramda')

function Route(resourceName, params) {
  if (!(this instanceof Route)) return new Route(resourceName, params);

  this.resourceName = resourceName;
  this.params = params;
}

Route.fromPath = path => {
  const parsed = qs.parse(path)

  return new Route(parsed.name, R.omit(['name'], parsed))
}

Route.prototype.asURL = function () {
  const query = qs.encode(this.params)

  let url = '?page=' + this.resourceName

  if (query) {
    url = url + '&' + query
  }

  return url
}
