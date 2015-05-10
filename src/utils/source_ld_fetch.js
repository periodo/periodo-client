"use strict";

const CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/'
    , CORS_PROXY_ENABLED = true

// Given a url, check if URL is a valid LD source. If it is, return a LD URI
// (which might be prefixed by a proxy, or transformed in some way because of
// CORS restrictions). If it is not, return null.
const WORLDCAT_REGEX = /worldcat.org\/.*?oclc\/(\d+).*/i
    , DOI_REGEX = /(?:dx.doi.org\/|doi:)([^\/]+\/[^\/\s]+)/

function match(text) {
  var uri;

  if (text.match(WORLDCAT_REGEX)) {
    uri = 'http://www.worldcat.org/oclc/' + text.match(WORLDCAT_REGEX)[1];
  } else if (text.match(DOI_REGEX)) {
    uri = 'http://dx.doi.org/' + text.match(DOI_REGEX)[1];
  }

  return uri || null;
}

function fetch(uri) {
  var ajax = require('../ajax').ajax
    , parse = require('./source_ld_parser')
    , opts = { dataType: 'text', accepts: { text: 'text/turtle' }}
    , url = CORS_PROXY_ENABLED ? CORS_PROXY_URL + uri : uri

  return ajax(url, opts).then(([ttl]) => parse(uri, ttl));
}

module.exports = { match, fetch }
