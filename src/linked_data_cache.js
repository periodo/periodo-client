"use strict";

var Dexie = require('dexie')
  , ajax = require('./ajax')
  , openedDB

const CORS_PROXY_URL = 'https://ptgolden.org/cors-anywhere/'
    , CORS_PROXY_ENABLED = true

function initDB() {
  var db = new Dexie('_linked_data_cache')

  db.version(1).stores({
    resources: '&url,*triples.subject,*triples.object'
  });

  db.open();

  return db;
}

function getDB() {
  if (!openedDB) openedDB = initDB();
  return openedDB;
}

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
  var formattedURL = formatURL(url)
    , parser

  // TODO: Validate the type here... or base it off of the extension on the URL

  parser = type === 'application/json+ld' ?
    require('./utils/parse_jsonld') :
    require('./utils/parse_rdf')

  return ajax.ajax({ url: formattedURL, headers: { Accept: type }})
    .then(([data]) => parser(data))
    .then(({ triples, prefixes }) => ({ triples, prefixes, url }))
}

function fetchAndSaveResource(url, type='text/turtle') {
  var savedResource;
  return fetchResource(url, type)
    .then(resource => (savedResource = resource))
    .then(resource => getDB().resources.put(resource))
    .then(() => savedResource)
}

function get(uri, type) {
  return getDB().resources
    .get(uri)
    .then(result => result || fetchAndSaveResource(uri, type))
    .catch(err => { throw err; });
}


module.exports = { get, fetchResource }
