"use strict";

const R = require('ramda')
    , ss = require('styled-system')

const ssProps = Object.values(ss.propTypes)
  .map(Object.keys)
  .reduce((a, b) => a.concat(b))

function blacklist(...keys) {
  return ssProps.concat(keys)
}

const ensureArray = R.ifElse(Array.isArray, R.identity, Array.of)

module.exports = {
  blacklist,
  ensureArray,
}
