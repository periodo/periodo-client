"use strict";

const Immutable = require('immutable')

function makeRangeBins(periods, numBins, min, max) {
  const { getEarliestYear, getLatestYear } = require('./terminus')

  let setMin = Infinity
    , setMax = -Infinity

  // First, get a list of all termini which have ISO values, while
  // simultaneously keeping track of the maximum and minimum
  const termini = Immutable.List().withMutations(list => {
    const iter = periods.values()

    let period

    while((period = iter.next().value)) {
      const earliest = getEarliestYear(period.get('start', Immutable.Map()))
          , latest = getLatestYear(period.get('stop', Immutable.Map()))

      if (earliest !== null && latest !== null) {
        list.push(Immutable.Map({ earliest, latest }));
        if (earliest < setMin) setMin = earliest;
        if (latest > setMax) setMax = latest;
      }
    }
  });

  if (min === undefined || max === undefined) {
    min = setMin;
    max = setMax;
  }

  // termini = termini.sortBy(terminus => terminus.get('start'));

  // If there were no periods with ISO years, throw an error.
  //
  // FIXME: maybe return null instead
  if (!isFinite(min) || !isFinite(max)) {
    throw new Error('Could not find minimum and maximum for periods.')
  }

  // Now, create a series of bins that will contain all of the given values
  const bins = Immutable.Range(min, max, (min - max) / numBins).map((binStart, i, all) => {
    const binStop = all.get(i + 1) || max;
    return Immutable.Map({ earliest: binStart, latest: binStop, count: 0 })
  });

  return bins.toList().withMutations(_bins => {
    termini.forEach(terminus => {
      const termMin = terminus.get('earliest')
          , termMax = terminus.get('latest')

      _bins.forEach((bin, i) => {
        const binMax = bin.get('latest')

        // If the terminus is not in a bin yet, continue iteration
        if (termMin >= binMax) return true;

        // The terminus is in a bin, so update its count.
        _bins.updateIn([i, 'count'], c => c + 1);

        // If we have added one to the count of every bin that this period
        // spans, we can stop iterating.
        if (termMax <= binMax) return false;
      });
    });
    _bins._range = [setMin, setMax];
  });
}

module.exports = { makeRangeBins }
