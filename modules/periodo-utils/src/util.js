"use strict";

const R = require('ramda')
    , qs = require('querystring')
    , { periodoServerURL } = require('../../periodo-app/src/globals')

const permalinkURL = 'http://n2t.net/ark:/99152/'

const knownPermalinks = {
  [`${permalinkURL}p0`]: 'https://data.perio.do/',
}

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

  if (url) {
    for (const [ arkURL, replacement ] of Object.entries(knownPermalinks)) {
      if (url.startsWith(arkURL)) {
        return fetch(url.replace(arkURL, replacement), init)
      }
    }
  }

  return fetch(resource, init)
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

function updateLayoutParams(updatedParams) {
  const prevParams = getLayoutParams()
      , { pathname, hash } = window.location

  const params = Object.fromEntries(
    Object.entries({
      ...prevParams,
      ...updatedParams,
    })
    .filter(([ , v ]) => v !== null)
  )

  history.replaceState(
    null,
    '',
    `${ pathname }?${ qs.stringify(params) }${ hash }`
  );
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

function textMatcher(query) {
  // match everything by default
  if (!query) {
    return () => true
  }
  // fallback to String.includes if query is not a valid regex
  let test = text => text
    ? text.toLowerCase().includes(query.replace(/\W/g, '').toLowerCase())
    : false
  // otherwise use RegExp.test
  try {
      const regex = new RegExp(
        // ignore pipe at the end of a regex as it is likely incomplete
        query.slice(-1) === '|' ? query.slice(0, -1) : query,
        'i'
      )
      test = text => regex.test(text)
  } catch (e) {
    if (e instanceof SyntaxError) {
      // ignore
    } else {
      throw e
    }
  }
  return test
}

const patchNumber = patchURL => {
  const { pathname } = new URL(patchURL)
      , match = pathname.match(/\d+/)

  return match ? match[0] : ''
}

module.exports = {
  oneOf,
  ensureArray,
  valueAsArray,
  permalink,
  downloadURL,
  permalinkAwareFetch,
  getLayoutOpts,
  getLayoutParams,
  updateLayoutParams,
  formatDate: formatter.format,
  textMatcher,
  patchNumber,
}
