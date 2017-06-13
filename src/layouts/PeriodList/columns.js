"use strict";

const Immutable = require('immutable')
    , h = require('react-hyperscript')
    , { getEarliestYear, getLatestYear } = require('../../util').terminus
    , { authorityOf } = require('../../util/period')
    , { displayTitle } = require('../../util/source')
    , { RouterKnower } = require('../../util/hoc')
    , { Box } = require('axs-ui')



module.exports = {
  label: {
    label: 'Label',
    getValue(period) {
      return period.label
    },
  },

  spatialCoverage: {
    label: 'Spatial coverage',
    getValue(period) {
      return period.spatialCoverageDescription
    },
  },

  source: {
    label: 'Source',
    getValue(period) {
      return h(RouterKnower(Box), [
        displayTitle(authorityOf(period).source),
        h('a', { href: '#' }, '(link)')
      ])
    }
  },

  start: {
    label: 'Start',
    getValue(period) {
      const start = period.get('start')

      return start ? getEarliestYear(start) : '(not given)'
    },
    sort(a, b, rev) {
      const mult = rev ? -1 : 1

      a = getEarliestYear(a.get('start', Immutable.Map()));
      b = getEarliestYear(b.get('start', Immutable.Map()));

      if (a === b) return 0;
      if (a == null) return -1;
      if (b == null) return 1;

      return mult * (a > b ? -1 : 1);
    }
  },

  stop: {
    label: 'Stop',
    getValue(period) {
      const stop = period.get('stop')

      return stop ? getEarliestYear(stop) : '(not given)'
    },
    sort(a, b, rev) {
      const mult = rev ? -1 : 1

      a = getLatestYear(a.get('stop', Immutable.Map()));
      b = getLatestYear(b.get('stop', Immutable.Map()));

      if (a === b) return 0;
      if (a == null) return -1;
      if (b == null) return 1;

      return mult * (a < b ? -1 : 1);
    }
  }
}
