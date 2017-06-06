"use strict";

// Given a url, check if URL is a valid LD source. If it is, return a LD URI
// (which might be prefixed by a proxy, or transformed in some way because of
// CORS restrictions). If it is not, return null.
const WORLDCAT_REGEX = /worldcat.org\/.*?oclc\/(\d+).*/i
    , DOI_REGEX = /(?:dx.doi.org\/|doi:)([^\/]+\/[^\/\s]+)/

module.exports = function toValidSourceURL(text='') {
  let url = null

  if (text.match(WORLDCAT_REGEX)) {
    url = 'http://www.worldcat.org/oclc/' + text.match(WORLDCAT_REGEX)[1];
  } else if (text.match(DOI_REGEX)) {
    url = 'http://dx.doi.org/' + text.match(DOI_REGEX)[1];
  }

  return url;
}
