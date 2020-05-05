"use strict";

const h = require('react-hyperscript')
    , contributorList = require('periodo-utils/src/contributor_list')
    , source = require('periodo-utils/src/source')
    , ListBlock = require('../ListBlock')
    , { Span, Text } = require('periodo-ui')
    , { Route } = require('org-shell')

const columns = {
  authors: {
    width: '10em',
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
    width: '6em',
    label: 'Year published',
    getValue(authority) {
      return source.yearPublished(authority.source)
    },
  },

  numPeriods: {
    width: '6em',
    label: 'Periods',
    getValue(authority) {
      return Object.keys(authority.periods).length
    },
    render(value) {
      return h(Text, {
        width: '4ch',
        textAlign: 'right',
      }, value)
    },
  },

  title: {
    width: '25em',
    label: 'Title',
    getValue(authority) {

      return source.title(authority.source)
    },
  },
}

module.exports = ListBlock({
  label: 'Authority List',
  description: 'Selectable list of period authorities.',
  emptyMessage: 'No authorities with matching sources',
  itemViewRoute(item, { backend }) {
    return Route('authority-view', {
      backendID: backend.asIdentifier(),
      authorityID: item.id,
    })
  },
  itemEditRoute(item, { backend }) {
    return Route('authority-edit', {
      backendID: backend.asIdentifier(),
      authorityID: item.id,
    })
  },
  defaultOpts: {
    limit: 10,
    start: 0,
    selected: [],
    sortBy: 'title',
    shownColumns: [ 'title', 'authors', 'yearPublished', 'numPeriods' ],
  },
  columns,
})
