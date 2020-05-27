"use strict"

function asJSONLD(data) {
  return {
    '@context': require('../context'),
    ...data,
  }
}

module.exports = {
  asJSONLD,
}
