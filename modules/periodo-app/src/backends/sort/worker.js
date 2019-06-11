"use strict";

const { terminus } = require('periodo-utils')
    , natsort = require('natsort')
    , sorter = natsort({ insensitive: true })

function sort(getter, vals) {
  const ret = new Map()

  const sorted = [...vals].sort((a, b) => {
    const _a = getter(a)
    const _b = getter(b)

    if (_a == null) return 1
    if (_b == null) return -1

    return sorter(_a, _b)
  })

  sorted.forEach((period, i) => {
    ret.set(period, i)
  })

  return ret
}

function reverse(getter, map) {
  let reversed = [...map.keys()].reverse()

  const toEnd = []
      , ret = new Map()

  while (reversed[0] && (getter(reversed[0]) == null)) {
    toEnd.push(reversed.shift())
  }

  reversed = reversed.concat(toEnd)

  reversed.forEach((period, i) => {
    ret.set(period, i)
  })

  return ret
}

const getters = {
  label: p => p.label,
  start: p => terminus.earliestYear(p.start),
  stop: p => terminus.latestYear(p.stop),
}

function sortPosByID(sortedMap) {
  return new Map([...sortedMap].map(([ k, v ]) => [ k.id, v ]))
}

module.exports = function sortWorker(self) {
  self.addEventListener('message', e => {
    const { key, periods } = e.data
        , fn = getters[key]

    const forwardSort = sort(fn, periods)
        , reverseSort = reverse(fn, forwardSort)

    self.postMessage({
      forward: sortPosByID(forwardSort),
      reverse: sortPosByID(reverseSort),
    })

    self.close()
  })
}
