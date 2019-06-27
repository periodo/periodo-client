"use strict";

const periodoServerURL = global.PERIODO_PROXY_URL || '/'

module.exports = {
  periodoServerURL,
  orcidURL: periodoServerURL + 'register',

  permalinkURL: global.PERIODO_PERMALINK_URL,

  corsProxyURL: global.PERIODO_PROXY_URL,
  corsProxyEnabled: global.CORS_PROXY_ENABLED,
}

