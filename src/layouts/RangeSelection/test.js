const test = require('tape')

test('Period range bins', t => {
  t.plan(2);

  const makeRangeBins = require('./make_range_bins')

  const periods = [
    { start: { in: { year: 100 }}, stop: { in: { year: 200 }}},
    { start: { in: { year: 100 }}, stop: { in: { year: 200 }}},
    { start: { in: { earliestYear: 150 }}, stop: { in: { year: 200 }}},
  ]

  const periods2 = [
    { start: { in: { year: -10000 }}, stop: { in: { year: 0 }}},
    { start: { in: { year: -12 }}, stop: { in: { year: -1 }}}
  ]

  t.deepEqual(
    makeRangeBins(periods, 4),
    Object.assign([
      { earliest: 100, latest: 125, count: 2 },
      { earliest: 125, latest: 150, count: 2 },
      { earliest: 150, latest: 175, count: 3 },
      { earliest: 175, latest: 200, count: 3 },
    ], { _range: [100, 200] })
  )

  t.deepEqual(
    makeRangeBins(periods2, 10),
    Object.assign([
      { earliest: -10000, latest: -9000, count: 1 },
      { earliest: -9000, latest: -8000, count: 1 },
      { earliest: -8000, latest: -7000, count: 1 },
      { earliest: -7000, latest: -6000, count: 1 },
      { earliest: -6000, latest: -5000, count: 1 },
      { earliest: -5000, latest: -4000, count: 1 },
      { earliest: -4000, latest: -3000, count: 1 },
      { earliest: -3000, latest: -2000, count: 1 },
      { earliest: -2000, latest: -1000, count: 1 },
      { earliest: -1000, latest: 0, count: 2 },
    ], { _range: [-10000, 0] })
  )
});
