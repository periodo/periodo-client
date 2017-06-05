"use strict";

const R = require('ramda')

module.exports = function makeRangeBins(periods, numBins, min, max) {
  const { getEarliestYear, getLatestYear } = require('../../util').terminus
      , termini = []

  let minYear = Infinity
    , maxYear = -Infinity

  // First, get a list of all termini which have ISO values, while
  // simultaneously keeping track of the maximum and minimum
  periods.forEach(period => {
    const earliest = getEarliestYear(period.start)
        , latest = getLatestYear(period.stop)

    if (earliest !== null && latest !== null) {
        termini.push({ earliest, latest });
        if (earliest < minYear) minYear = earliest;
        if (latest > maxYear) maxYear = latest;
    }
  })

  if (min === undefined) {
    min = minYear;
  }

  if (max === undefined) {
    max = maxYear;
  }

  // Round to the closest multiple of 25
  min = Math.floor(min / 25) * 25
  max = Math.ceil(max / 25) * 25

  // FIXME: maybe return null instead
  if (!isFinite(min) || !isFinite(max)) {
    throw new Error('Could not find minimum and maximum for periods.')
  }

  // Now, create a series of bins that will contain all of the given values
  const step = (max - min) / numBins

  const bins = R.range(0, numBins).map(i => {
    const earliest = min + (step * i)
        , latest = earliest + step

    return { earliest, latest, count: 0 }
  })

  termini.forEach(terminus => {
    const termMin = terminus.earliest
        , termMax = terminus.latest

    for (let i = 0; i < bins.length; i++) {
      const binMax = bins[i].latest

      if (termMin >= binMax) continue;

      // Otherwise, the terminus is in a bin, so update its count.
      bins[i].count += 1;

      // If we have added one to the count of every bin that this period
      // spans, we can stop iterating.
      if (termMax <= binMax) break;
    }
  })

  bins._range = [minYear, maxYear]

  return bins;
}
