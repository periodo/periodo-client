"use strict";

const R = require('ramda')
    , { parse } = require('periodo-date-parser')
    , { oneOf } = require('./util')

const paths = {
  earliest: [ 'in', 'earliestYear' ],
  latest: [ 'in', 'latestYear' ],
  single: [ 'in', 'year' ],
}

const isMultipart = terminus => {
  return (
    R.path(paths.earliest, terminus) !== undefined ||
    R.path(paths.latest, terminus) !== undefined
  )
}

// Terminus -> String
function asString(terminus) {
  if (isMultipart(terminus)) {
    let earliest = earliestYear(terminus)
      , latest = latestYear(terminus)

    if (earliest === null) earliest = '(unknown)';
    if (latest === null) latest = '(unknown)';

    return `range from ${earliest} to ${latest}`
  } else {
    const value = earliestYear(terminus)

    return value === null ? null : ('' + value);
  }
}

// Terminus -> Int or Null
function earliestYear(terminus) {
  let year

  year = oneOf(
    R.path(paths.single),
    R.path(paths.earliest),
    t => t.label === 'present' ? (new Date().getFullYear()) : null
  )(terminus)

  if (year === '') year = null;

  return year === null ? null : parseInt(year);
}

// Terminus -> Int or Null
function latestYear(terminus) {
  let year

  year = oneOf(
    R.path(paths.single),
    R.path(paths.latest),
    t => t.label === 'present' ? (new Date().getFullYear()) : null
  )(terminus)

  if (year === '') year = null;

  return year === null ? null : parseInt(year);
}

// Terminus -> Bool
function hasISOValue(terminus) {
  return (
    earliestYear(terminus) !== null ||
    latestYear(terminus) !== null
  )
}

const ISO_YEAR = /^(-)?\s*(\d+)$/

// note that this mutates the terminus to fix it
function ensureISOYear(terminus) {
  Object.values(paths).forEach(path => {
    const year = `${R.path(path, terminus)}`.replace(/\s/g, '')
        , matched = year.match(ISO_YEAR)

    if (matched) {
      const [ , negative, digits ] = matched

      terminus[path[0]][path[1]] = (
        `${negative || ''}${digits.padStart(4, '0')}`
      )
    }
  })
}

// Terminus -> Bool
function wasAutoparsed(terminus) {
  // This was checking if the terminus is blank. If it was, it would return
  // that it's autoparsed- that's probably not the best thing to do.
  /*
  if (!terminus.get('label')) {
    return !hasISOValue(terminus)
  }
  */

  let parsed

  try {
    parsed = parse(terminus.label)
  } catch (err) {
    parsed = null;
  }

  return parsed
    ? R.equals(terminus, R.omit([ '_type' ])(parsed))
    : terminus.in === null
}

module.exports = {
  asString,
  earliestYear,
  latestYear,
  hasISOValue,
  ensureISOYear,
  wasAutoparsed,
  isMultipart,
}
