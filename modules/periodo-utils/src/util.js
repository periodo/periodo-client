"use strict";

const R = require('ramda')
    , qs = require('querystring')
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
  ? permalink({ id })
  : id && id.startsWith('p0')
    ? `${ periodoServerURL }${ id.slice(2) }`
    : null

function getLayoutOpts() {
  if (window.location.hash.length == 0) {
    return {}
  }
  const opts = Object.fromEntries(
    Object.entries(qs.parse(window.location.hash.slice(1)))
      .map(([ k, v ]) => [ k, JSON.parse(v) ])
  )
  return opts
}

function getLayoutParams() {
  if (window.location.search.length == 0) {
    return {}
  }
  return qs.parse(window.location.search.slice(1))
}

module.exports = {
  oneOf,
  ensureArray,
  valueAsArray,
  permalink,
  downloadURL,
  getLayoutOpts,
  getLayoutParams,
}
