"use strict";

module.exports = [
  ['backend-select', '/backends/', require('./pages/BackendSelect')],
  ['backend-home', '/backends/:type/:idOrURL/', require('./pages/BackendHome')],
]
