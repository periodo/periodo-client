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
  corsProxyURL: global.PERIODO_PROXY_URL,
  corsProxyEnabled: global.CORS_PROXY_ENABLED,
}
