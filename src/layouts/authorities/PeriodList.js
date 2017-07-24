"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { earliestYear, latestYear } = require('lib/util/terminus')
    , { authorityOf } = require('lib/util/period')
    , { displayTitle } = require('lib/util/source')
    , { Link } = require('lib/ui')
    , { Box } = require('axs-ui')
    , { Route } = require('lib/router')
    , List = require('lib/layout-engine/List')

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
    getValue(period, backend) {
      return h(Box, [
        displayTitle(authorityOf(period).source),
        h(Link, {
          href: Route('backend-authority-view', {
            backendID: backend.asIdentifier(),
            authorityID: authorityOf(period).id
          })
        }, '(link)')
      ])
    }
  },

  start: {
    label: 'Start',

    getValue(period) {
      return earliestYear(period.start) || '(not given)'
    },

    sort(rev, a, b) {
      const mult = rev ? -1 : 1

      a = earliestYear(a.start || {})
      b = earliestYear(b.start || {})

      if (a === b) return 0;
      if (a == null) return 1;
      if (b == null) return -1;

      return mult * (a > b ? 1 : -1);
    }
  },

  stop: {
    label: 'Stop',
    getValue(period) {
      return latestYear(period.stop) || '(not given)'
    },
    sort(rev, a, b) {
      const mult = rev ? 1 : -1

      a = latestYear(a.stop || {})
      b = latestYear(b.stop || {})

      if (a === b) return 0;
      if (a == null) return 1;
      if (b == null) return -1;

      return mult * (a < b ? 1 : -1);
    }
  }
}

const defaultOpts = {
  limit: 25,
  start: 0,
  sortBy: 'label',
  selected: [],
  shownColumns: ['label', 'start', 'stop'],
}


module.exports = List(
  'Period List',
  'Selectable list of periods.',
  defaultOpts,
  R.map(
    R.pipe(R.prop('definitions'), R.values)
  ),
  columns,
)
