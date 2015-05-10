"use strict";

var Immutable = require('immutable')
  , parseDate = require('../utils/date_parser')

function getEarliestYear(terminus) {
  var year

  year = (
    terminus.getIn(['in', 'year']) ||
    terminus.getIn(['in', 'earliestYear']) ||
    (terminus.get('label') === 'present' ? (new Date().getFullYear()) : null)
  )

  return year ? parseInt(year) : null;
}

function getLatestYear(terminus) {
  var year

  year = (
    terminus.getIn(['in', 'year']) ||
    terminus.getIn(['in', 'latestYear']) ||
    (terminus.get('label') === 'present' ? (new Date().getFullYear()) : null)
  )

  return year ? parseInt(year) : null;
}

function hasISOValue(terminus) {
  return !!(getEarliestYear(terminus) || getLatestYear(terminus))
}

function wasAutoparsed(terminus) {
  var parsed

  if (!terminus.get('label')) {
    return !hasISOValue(terminus)
  }

  parsed = parseDate(terminus.get('label'));

  return parsed ?
    Immutable.is(terminus, Immutable.fromJS(parsed).delete('_type')) :
    terminus.get('in') === null;
}

module.exports = { getEarliestYear, getLatestYear, hasISOValue, wasAutoparsed }
