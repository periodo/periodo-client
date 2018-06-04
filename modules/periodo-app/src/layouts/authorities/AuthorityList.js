"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , contributorList = require('periodo-utils/src/contributor_list')
    , source = require('periodo-utils/src/source')
    , { blocks } = require('org-layouts')
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
    }
  },

  yearPublished: {
    label: 'Year published',
    getValue(authority) {
      return source.yearPublished(authority.source)
    }
  },

  numPeriods: {
    label: 'Num. of periods',
    getValue(authority) {
      return Object.keys(authority.periods).length
    }
  },

  title: {
    label: 'Title',
    getValue(authority) {

      return source.title(authority.source)
    }
  }
}

module.exports = blocks.List({
  label: 'Authority List',
  description: 'Selectable list of period authorities.',
  makeItemRoute({ item, backend }) {
    return Route('authority-view', {
      backendID: backend.asIdentifier(),
      authorityID: item.id,
    })
  },
  defaultOpts: {
    limit: 25,
    start: 0,
    selected: [],
    shownColumns: ['title', 'authors', 'yearPublished', 'numPeriods'],
  },
  transducer: R.map(R.prop('authority')),
  columns,
})
