"use strict";

const { CORS_PROXY_URL, CORS_PROXY_ENABLED } = global

module.exports = function formatURL(url) {
  return (CORS_PROXY_ENABLED && url.indexOf(CORS_PROXY_URL) === -1)
    ? CORS_PROXY_URL + url
    : url
}
