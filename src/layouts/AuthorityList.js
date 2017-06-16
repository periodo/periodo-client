"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { contributorList } = require('../util')
    , makeList = require('./List')
    , { generateRoute } = require('../router')
    , { urlParam } = require('../backends/utils')

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
      const href = generateRoute('backend-view-authority', {
        identifier: urlParam(backend.type)
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
