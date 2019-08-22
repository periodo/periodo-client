"use strict";

const R = require('ramda')
    , { permalinkURL } = require('../../periodo-app/src/globals')

function oneOf(...candidates) {
  return x => {
    for (let i = 0; i < candidates.length; i++) {
      const val = candidates[i](x)
      if (val !== undefined) return val
    }
  }
}

const ensureArray = R.ifElse(Array.isArray, R.identity, Array.of)

const valueAsArray = R.curry(
  (prop, obj) => ensureArray(R.propOr([], prop, obj))
)

const permalink = ({ id }) => id && id.startsWith('p0')
  ? `${ permalinkURL }${ id }`
  : null

module.exports = {
  oneOf,
  ensureArray,
  valueAsArray,
  permalink,
}
