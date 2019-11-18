"use strict";

let periodoServerURL

if (typeof window !== 'undefined') {
  periodoServerURL = (
    global.PERIODO_SERVER_URL ||
    new URL('/', window.location).href
  )
}

module.exports = {
  periodoServerURL,
  permalinkURL: global.PERIODO_PERMALINK_URL,
  corsProxyURL: global.PERIODO_PROXY_URL,
  corsProxyEnabled: global.CORS_PROXY_ENABLED,
}
