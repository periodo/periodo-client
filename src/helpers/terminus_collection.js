"use strict";

var { getEarliestYear, getLatestYear } = require('./terminus')

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

module.exports = { maxYear, minYear }
