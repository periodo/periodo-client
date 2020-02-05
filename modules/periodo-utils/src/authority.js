"use strict";

const R = require('ramda')
    , source = require('./source')
    , terminusList = require('./terminus_list')
    , { $$Authority } = require('./symbols')

function periodsWithAuthority(authority) {
  return R.map(
    R.assoc($$Authority, authority),
    R.values(authority.periods)
  )
}

function periods(authority) {
  return R.values(authority.periods)
}

function displayTitle(authority) {
  return source.displayTitle(authority.source)
}

function describe(authority) {
  const periods = R.values(authority.periods || {})

  return {
    id: authority.id,
    source: displayTitle(authority),
    periods: periods.length,
    earliest: terminusList.minYear(R.map(R.path([ 'start' ]))(periods)),
    latest: terminusList.maxYear(R.map(R.path([ 'stop' ]))(periods)),
    editorialNote: authority.editorialNote || '',
  }
}

module.exports = {
  displayTitle,
  describe,
  periods,
  periodsWithAuthority,
}
