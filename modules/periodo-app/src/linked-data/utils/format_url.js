"use strict";

const { corsProxyURL, corsProxyEnabled } = require('../../globals')

module.exports = function formatURL(url) {
  return (corsProxyEnabled && url.indexOf(corsProxyURL) === -1)
    ? corsProxyURL + url
    : url
}
