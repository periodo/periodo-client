"use strict";

function maxYear(termini) {
  var latest = termini.maxBy(getLatestYear) || null;
  return latest && {
    label: latest.get('label'),
    iso: getLatestYear(latest)
  }
}

function minYear(termini) {
  var earliest = termini.minBy(getEarliestYear) || null;
  return earliest && {
    label: earliest.get('label'),
    iso: getEarliestYear(earliest)
  }
}

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

module.exports = {
  getEarliestYear: getEarliestYear,
  getLatestYear: getLatestYear,
  minYear,
  maxYear
}
