"use strict";

const R = require('ramda')
    , { permalinkURL
      , periodoServerURL } = require('../../periodo-app/src/globals')

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

const downloadURL = ({ id }) => periodoServerURL.includes('://data.perio.do')
  ? permalinkURL({ id })
  : id && id.startsWith('p0')
    ? `${ periodoServerURL }${ id.slice(2) }`
    : null

module.exports = {
  oneOf,
  ensureArray,
  valueAsArray,
  permalink,
  downloadURL,
}
