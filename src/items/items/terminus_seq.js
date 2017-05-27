"use strict";

const R = require('ramda')
    , { getEarliestYear, getLatestYear } = require('./terminus')

// Iterable<Terminus> -> Object({ label: String, iso: Int }) or Null
function maxYear(termini) {
  const latest = termini.reduce((prev, terminus) => {
    const iso = getLatestYear(terminus) || -Infinity

    return iso > prev.iso ? { terminus, iso } : prev
  }, { terminus: null, iso: -Infinity })

  if (latest.terminus === null) return null;

  return {
    label: latest.terminus.label,
    iso: latest.iso
  }
}

// Iterable<Terminus> -> Object({ label: String, iso: Int }) or Null
function minYear(termini) {
  const earliest = termini.reduce((prev, terminus) => {
    const iso = getEarliestYear(terminus) || Infinity

    return iso < prev.iso ? { terminus, iso } : prev
  }, { terminus: null, iso: Infinity })

  if (earliest.terminus === null) return null;

  return {
    label: earliest.terminus.label,
    iso: earliest.iso
  }
}

module.exports = {
  maxYear,
  minYear,
}
