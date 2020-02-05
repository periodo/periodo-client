"use strict";

const h = require('react-hyperscript')
    , contributorList = require('periodo-utils/src/contributor_list')
    , source = require('periodo-utils/src/source')
    , ListBlock = require('../ListBlock')
    , { Span } = require('periodo-ui')
    , { Route } = require('org-shell')

const columns = {
  authors: {
    label: 'Authors',
    getValue(authority) {
      const creators = source.creators(authority.source)
          , contributors = source.contributors(authority.source)

      const list = creators.length ? creators : contributors

      return list.length
        ? contributorList.asString(list)
        : h(Span, {
          color: 'gray',
        }, '(not given)')
    },
  },

  yearPublished: {
    label: 'Year published',
    getValue(authority) {
      return source.yearPublished(authority.source)
    },
  },

  numPeriods: {
    label: 'Num. of periods',
    getValue(authority) {
      return Object.keys(authority.periods).length
    },
  },

  title: {
    label: 'Title',
    getValue(authority) {

      return source.title(authority.source)
    },
  },
}

module.exports = ListBlock({
  label: 'Authority List',
  description: 'Selectable list of period authorities.',
  navigateToItem(item, { navigateTo, backend }) {
    const route = Route('authority-view', {
      backendID: backend.asIdentifier(),
      authorityID: item.id,
    })

    navigateTo(route)
  },
  defaultOpts: {
    limit: 25,
    start: 0,
    selected: [],
    sortBy: 'title',
    shownColumns: [ 'title', 'authors', 'yearPublished', 'numPeriods' ],
  },
  columns,
})
