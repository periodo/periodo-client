"use strict";

const Dexie = require('dexie')


const CORS_PROXY_URL = 'https://ptgolden.org/cors-anywhere/'
    , CORS_PROXY_ENABLED = true

let openedDB


function getDB() {
  if (!openedDB) {
    openedDB = new Dexie('_linked_data_cache')

    openedDB.version(1).stores({
      resources: '&url,*triples.subject,*triples.object'
    });

    openedDB.open();
  }

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


function fetchAndSaveResource(url, type='text/turtle') {
  let savedResource

  return fetchResource(url, type)
    .then(resource => (savedResource = resource))
    .then(resource => getDB().resources.put(resource))
    .then(() => savedResource)
}


function get(uri, type) {
  return getDB().resources.get(uri)
    .then(result => result || fetchAndSaveResource(uri, type))
    .catch(err => { throw err; });
}


module.exports = { get, fetchResource }
