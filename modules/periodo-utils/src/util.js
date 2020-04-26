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

const permalinkAwareFetch = (resource, init) => {
  let url = undefined

  if (typeof resource === 'string') {
    url = resource
  } else if (typeof resource === 'object' &&
             typeof resource.href === 'string') {
    url = resource.href
  }

  if (url && url.startsWith(permalinkURL)) {
    return fetch(url.replace(permalinkURL + 'p0', periodoServerURL), init)
  } else {
    return fetch(resource, init)
  }
}

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

const formatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  hour12: false,
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
})

module.exports = {
  oneOf,
  ensureArray,
  valueAsArray,
  permalink,
  downloadURL,
  permalinkAwareFetch,
  getLayoutOpts,
  getLayoutParams,
  formatDate: formatter.format,
}
