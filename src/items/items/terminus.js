"use strict";

const R = require('ramda')
    , { parse } = require('periodo-date-parser')
    , { oneOf } = require('../utils')

const paths = {
  earliest: ['in', 'earliestYear'],
  latest: ['in', 'latestYear'],
  single: ['in', 'year'],
}

const isMultiPart = R.any(R.hasIn)([paths.earliest, paths.latest])

// Terminus -> String
function asString(terminus) {
  if (isMultiPart(terminus)) {
    let earliest = getEarliestYear(terminus)
      , latest = getLatestYear(terminus)

    if (earliest === null) earliest = '(unknown)';
    if (latest === null) latest = '(unknown)';

    return `range from ${earliest} to ${latest}`
  } else {
    const value = getEarliestYear(terminus)

    return value === null ? null : ('' + value);
  }
}

// Terminus -> Int or Null
function getEarliestYear(terminus) {
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
function getLatestYear(terminus) {
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
    getEarliestYear(terminus) !== null ||
    getLatestYear(terminus) !== null
  )
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
    ? R.equals(terminus, R.omit(['_type'])(parsed))
    : terminus.in === null
}

module.exports = {
  asString,
  getEarliestYear,
  getLatestYear,
  hasISOValue,
  wasAutoparsed
}
