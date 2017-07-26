"use strict";

const url = require('url')
    , qs = require('querystring')
    , NotFound = require('../src/main/components/NotFound')

function match(path) {
  const resources = require('../src/modules').getApplicationResources()
      , params = url.parse(path, true).query

  const resourceName = params.page || ''

  const resource = resources[resourceName] || {
    Component: NotFound
  }

  return Object.assign({ params }, resource);
}

function generateRoute(resourceName, params) {
  const query = qs.encode(params)

  let url = '?page=' + resourceName

  if (query) {
    url = url + '&' + query
  }

  return url
}

function trigger(resourceName, params) {
  if (resourceName instanceof Route) {
    params = resourceName.params;
    resourceName = resourceName.page;
  }

  window.PeriodO.locationStream.write({
    path: generateRoute(resourceName, params),
    pushState: true
  })
}

function Route(page, params) {
  if (!(this instanceof Route)) return new Route(page, params);

  this.page = page;
  this.params = params;
}

Route.prototype.url = function () {
  return generateRoute(this.page, this.params)
}

module.exports = {
  match,
  generateRoute,
  trigger,
  Route,
}
