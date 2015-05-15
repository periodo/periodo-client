"use strict";

var Immutable = require('immutable')

function makeRangeBins(periods, numBins) {
  var { getEarliestYear, getLatestYear } = require('./terminus')
    , min = Infinity
    , max = -Infinity
    , termini
    , bins

  termini = Immutable.List().withMutations(list => {
    let iter = periods.values()
      , period

    while((period = iter.next().value)) {
      let earliest = getEarliestYear(period.get('start'))
        , latest = getLatestYear(period.get('stop'))

      if (earliest && latest) {
        list.push(Immutable.Map({ earliest, latest }));
        if (earliest < min) min = earliest;
        if (latest > max) max = latest;
      }
    }
  });

  if (!isFinite(min) || !isFinite(max)) {
    throw new Error('Could not find minimum and maximum for periods.')
  }

  bins = Immutable.Range(min, max, (min - max) / numBins).map((binStart, i, all) => {
    let binStop = all.get(i + 1) || max;
    return Immutable.Map({ earliest: binStart, latest: binStop, count: 0 })
  });

  return bins.toList().withMutations(function (_bins) {
    termini.forEach(terminus => {
      _bins.forEach((bin, i) => {
        if (bin.get('earliest') < terminus.get('earliest')) {
          // terminus not in range yet, continue iteration
          return true;
        } else if (bin.get('earliest') >= terminus.get('latest')) {
          // terminus out of range, stop iteration
          return false;
        } else {
          // terminus in range; add to count
          _bins.updateIn([i, 'count'], c => c + 1);
        }
      });
    });
  });
}

module.exports = { makeRangeBins }
