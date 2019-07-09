"use strict";

const { corsProxyURL, corsProxyEnabled } = require('../../globals')

const CORS_PROXY_SITES = /(?:(?:\.worldcat.org)|(?:\.orcid\.org))\//

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
