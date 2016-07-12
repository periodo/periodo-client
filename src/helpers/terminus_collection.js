"use strict";

const { getEarliestYear, getLatestYear } = require('./terminus')

function maxYear(termini) {
  const latest = termini.maxBy(getLatestYear) || null

  return latest && {
    label: latest.get('label'),
    iso: getLatestYear(latest)
  }
}

function minYear(termini) {
  const earliest = termini.minBy(getEarliestYear) || null

  return earliest && {
    label: earliest.get('label'),
    iso: getEarliestYear(earliest)
  }
}

module.exports = {
  maxYear,
  minYear,
}
