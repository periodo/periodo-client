"use strict";

const { corsProxyURL, corsProxyEnabled } = require('../../globals')

const CORS_PROXY_SITES = /(?:(?:\Wworldcat.org)|(?:\Worcid\.org))\//

module.exports = function formatURL(url) {
  const useProxy = (
    corsProxyEnabled &&
    url.indexOf(corsProxyURL) === -1 &&
    CORS_PROXY_SITES.test(url)
  )

  return useProxy
    ? corsProxyURL + url
    : url
}
