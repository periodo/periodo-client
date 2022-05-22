"use strict";

const R = require('ramda')
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

// FIXME?: In the following two functions, our ARK shoulder, and the URI of
// our production server are hardcoded. This is fine now, but in some imagined
// future where someone wanted to start their own periodo instance with their
// own persistent URI scheme, this would not work.
const permalink = ({ id }) => {
  if (id && id.startsWith('p0')) {
    return `${ permalinkURL }${ id }`
  }

  return null
}

const downloadURL = ({ id }) => {
  let url = null

  if (periodoServerURL.includes('://data.perio.do')) {
    url = permalink({ id })
  } else if (id && id.startsWith('p0')) {
    url = `${ periodoServerURL }${ id.slice(2) }`
  }

  if (url && window.location.protocol === 'https:') {
    // avoid non-HTTPS downloads started on secure pages
    const urlObject = new URL(url)
    urlObject.protocol = 'https:'
    url = urlObject.toString()
  }

  return url
}

const permalinkAwareFetch = (resource, init) => {
  let url = undefined

  if (typeof resource === 'string') {
    url = resource
  } else if (typeof resource === 'object' &&
             typeof resource.href === 'string') {
    url = resource.href
  }

  if (url) {
    for (const [ permalink, replacement ] of Object.entries(knownPermalinks)) {
      if (url.startsWith(permalink)) {
        return fetch(url.replace(permalink, replacement), init)
      }
    }
  }

  return fetch(resource, init)
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
  formatDate: formatter.format,
  textMatcher,
  patchNumber,
}
