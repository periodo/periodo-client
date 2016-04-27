"use strict";

const Immutable = require('immutable')
    , parseDate = require('../utils/date_parser')

function oneOf(...candidates) {
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i] !== undefined) {
      return candidates[i];
    }
  }
}

function asString(terminus) {
  if (terminus.hasIn(['in', 'earliestYear']) || terminus.hasIn(['in', 'latestYear'])) {
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

function getEarliestYear(terminus) {
  let year

  year = oneOf(
    terminus.getIn(['in', 'year']),
    terminus.getIn(['in', 'earliestYear']),
    (terminus.get('label') === 'present' ? (new Date().getFullYear()) : null)
  )

  if (year === '') year = null;

  return year === null ? null : parseInt(year);
}

function getLatestYear(terminus) {
  let year

  year = oneOf(
    terminus.getIn(['in', 'year']),
    terminus.getIn(['in', 'latestYear']),
    (terminus.get('label') === 'present' ? (new Date().getFullYear()) : null)
  )

  if (year === '') year = null;

  return year === null ? null : parseInt(year);
}

function hasISOValue(terminus) {
  return (getEarliestYear(terminus) !== null || getLatestYear(terminus) !== null)
}

function wasAutoparsed(terminus) {
  // This was checking if the terminus is blank. If it was, it would return
  // that it's autoparsed- that's probably not the best thing to do.
  /*
  if (!terminus.get('label')) {
    return !hasISOValue(terminus)
  }
  */

  const parsed = parseDate(terminus.get('label'));

  return parsed ?
    Immutable.is(terminus, Immutable.fromJS(parsed).delete('_type')) :
    terminus.get('in') === null;
}

module.exports = { asString, getEarliestYear, getLatestYear, hasISOValue, wasAutoparsed }
