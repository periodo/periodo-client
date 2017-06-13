"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { earliestYear, latestYear } = require('../util').terminus
    , { authorityOf } = require('../util/period')
    , { displayTitle } = require('../util/source')
    , { RouterKnower } = require('../util/hoc')
    , { periodsWithAuthority } = require('../util/authority')
    , { Box } = require('axs-ui')
    , List = require('./List')

const columns = {
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
      return earliestYear(period.start) || '(not given)'
    },

    sort(a, b, rev) {
      const mult = rev ? -1 : 1

      a = earliestYear(a.start || {})
      b = earliestYear(b.start || {})

      if (a === b) return 0;
      if (a == null) return -1;
      if (b == null) return 1;

      return mult * (a > b ? -1 : 1);
    }
  },

  stop: {
    label: 'Stop',
    getValue(period) {
      return latestYear(period.stop) || '(not given)'
    },
    sort(a, b, rev) {
      const mult = rev ? -1 : 1

      a = latestYear(a.stop || {})
      b = latestYear(b.stop || {})

      if (a === b) return 0;
      if (a == null) return -1;
      if (b == null) return 1;

      return mult * (a < b ? -1 : 1);
    }
  }
}

const defaultOpts = {
  limit: 20,
  start: 0,
  selected: [],
  shownColumns: ['label', 'start', 'stop'],
}


exports.handler = List(
  'Period List',
  'Selectable list of periods.',
  defaultOpts,
  R.map(periodsWithAuthority),
  columns,
)
