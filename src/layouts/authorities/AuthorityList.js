"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , contributorList = require('lib/util/contributor_list')
    , makeList = require('lib/layout-engine/List')
    , { generateRoute } = require('../../router')

const columns = {
  authors: {
    label: 'Authors',
    getValue(authority) {
      const { creators=[] } = authority.source

      return creators.length
        ? contributorList.asString(creators)
        : '(not given)'
    }
  },

  yearPublished: {
    label: 'Year published',
    getValue(authority) {
      return authority.source.yearPublished
    }
  },

  numDefinitions: {
    label: 'Num. of definitions',
    getValue(authority) {
      return Object.keys(authority.definitions).length
    }
  },

  title: {
    label: 'Title',
    getValue(authority, backend) {
      const href = generateRoute('backend-authority', {
        identifier: backend.type.asIdentifier(),
      }, {
        id: authority.id
      })

      return h('div', [
        authority.title,
        h('a', { href: href }, 'LINK')
      ])
    }
  }
}

const defaultOpts = {
  limit: 20,
  start: 0,
  selected: [],
  shownColumns: ['title', 'authors', 'yearPublished', 'numDefinitions'],
}


exports.handler = makeList(
  'Authority List',
  'Selectable list of period authorities.',
  defaultOpts,
  R.map(R.identity),
  columns,
)
