"use strict";

const R = require('ramda')

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

module.exports = {
  oneOf,
  ensureArray,
  valueAsArray,
}
