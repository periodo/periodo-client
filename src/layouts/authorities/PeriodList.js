"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { earliestYear, latestYear } = require('lib/util/terminus')
    , { authorityOf } = require('lib/util/period')
    , { yearPublished, displayTitle } = require('lib/util/source')
    , { Link } = require('lib/ui')
    , { Box } = require('axs-ui')
    , { Route } = require('lib/router')
    , makeListLayout = require('lib/layout-engine/List')

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

  publicationDate: {
    label: 'Publication date',
    getValue(period, backend) {
      return yearPublished(authorityOf(period).source)
    }
  },

  start: {
    label: 'Start',

    getValue(period) {
      return earliestYear(period.start)
    },

  },

  stop: {
    label: 'Stop',
    getValue(period) {
      return latestYear(period.stop)
    },
  }
}

module.exports = makeListLayout({
  label: 'Period List',
  description: 'Selectable list of periods.',

  makeItemRoute({ item, backend }) {
    return Route('backend-period-view', {
      backendID: backend.asIdentifier(),
      authorityID: authorityOf(item).id,
      periodID: item.id,
    })
  },

  defaultOpts: {
    limit: 25,
    start: 0,
    sortBy: 'label',
    selected: [],
    shownColumns: ['start', 'stop', 'label', 'spatialCoverage', 'publicationDate'],
  },
  transducer: R.map(
    R.pipe(R.prop('definitions'), R.values)
  ),
  columns,
})
