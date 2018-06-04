"use strict";

const d3 = require('d3')
    , R = require('ramda')
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
    earliest: terminusList.minYear(R.map(R.path(['start']))(periods)),
    latest: terminusList.maxYear(R.map(R.path(['stop']))(periods)),
  }
}

function asCSV(authority) {
  const { getEarliestYear, getLatestYear } = require('./terminus')

  return d3.csv.format(authority.get('periods').map(period => {
    const start = period.get('start')
        , stop = period.get('stop')

    return {
      'label': period.get('label'),
      'start_label': start.get('label'),
      'earliest_start': getEarliestYear(start),
      'latest_start': getLatestYear(start),
      'stop_label': stop.get('label'),
      'earliest_stop': getEarliestYear(stop),
      'latest_stop': getLatestYear(stop),
      'spatialCoverages': (period.spatialCoverage || []).map(sc => sc.id).join('|'),
      'note': period.get('note'),
      'editorial_note': period.get('editorialNote')
    }
  }))
}

module.exports = {
  asCSV,
  displayTitle,
  describe,
  periods,
  periodsWithAuthority,
}
