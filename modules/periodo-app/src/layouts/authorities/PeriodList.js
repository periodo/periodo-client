"use strict";

const R = require('ramda')
    , { earliestYear, latestYear } = require('periodo-utils/src/terminus')
    , { authorityOf } = require('periodo-utils/src/period')
    , { yearPublished } = require('periodo-utils/src/source')
    , { Route } = require('org-shell')
    , { blocks } = require('org-layouts')
    , { cachedSort } = require('../../backends/sort')

const columns = {
  label: {
    label: 'Label',
    sort: (periods, { dataset, sortDirection }) => {
      return cachedSort(dataset, periods, 'label', sortDirection === "desc")
    },
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
    getValue(period) {
      return yearPublished(authorityOf(period).source)
    }
  },

  start: {
    label: 'Start',

    sort: (periods, { dataset, sortDirection }) => {
      return cachedSort(dataset, periods, 'start', sortDirection === "desc")
    },

    getValue(period) {
      return earliestYear(period.start)
    },

  },

  stop: {
    label: 'Stop',

    sort: (periods, { dataset, sortDirection }) => {
      return cachedSort(dataset, periods, 'stop', sortDirection === "desc")
    },

    getValue(period) {
      return latestYear(period.stop)
    },
  }
}

module.exports = blocks.List({
  label: 'Period List',
  description: 'Selectable list of periods.',

  makeItemRoute({ item, backend }) {
    return Route('period-view', {
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
    R.pipe(R.prop('periods'), R.values)
  ),
  columns,
})
