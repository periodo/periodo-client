"use strict";

const periodoDB = require('../db')

const CORS_PROXY_URL = 'https://ptgolden.org/cors-anywhere/'
    , CORS_PROXY_ENABLED = true


function formatURL(url) {
  if (CORS_PROXY_ENABLED && url.indexOf(CORS_PROXY_URL) === -1) {
    url = CORS_PROXY_URL + url;
  }
  return url
}

/*
 * TODO (maybe): Triples aren't actually indexed right now. Maybe store each
 * triple individually, using a hash of the triple and the url as an ID. But
 * then, how to deal with blank nodes?
 *
function formatResource(url, triples) {
  var hashObject = require('./utils/patch').hashPatch;
  return triples.map(triple => {
    var data = _.extend(triple, { url })
      , hash = hashObject(data)

    data = _.extend(triple, { hash });
    return data;
  });
}
*/

function fetchResource(url, type="text/turtle") {
  return () => {
    const formattedURL = formatURL(url)

    // TODO: Validate the type here... or base it off of the extension on the URL
    const parser = type === 'application/json+ld'
      ? require('./utils/parse_jsonld')
      : require('./utils/parse_rdf')

    return fetch(formattedURL, { mode: 'cors', headers: { Accept: type }})
      .then(resp => {
        if (resp.ok) {
          return resp.text();
        } else {
          throw new Error(`Could not fetch ${resp.url} (${resp.status}):\n\n${resp.statusText}`);
        }
      })
      .then(parser)
      .then(({ triples, prefixes }) => ({ triples, prefixes, url }))
  }
}


function fetchAndSaveResource(url, type='text/turtle') {
  return () => {
    let savedResource

    return fetchResource(url, type)
      .then(resource => (savedResource = resource))
      .then(resource => periodoDB().resources.put(resource))
      .then(() => savedResource)
  }
}


function get(uri, type) {
  return () => {
    return periodoDB().resources.get(uri)
      .then(result => result || fetchAndSaveResource(uri, type))
      .catch(err => { throw err; });
  }
}


module.exports = { get, fetchResource }
