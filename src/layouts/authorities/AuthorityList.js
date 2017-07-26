"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , contributorList = require('lib/util/contributor_list')
    , makeList = require('lib/layout-engine/List')
    , { Link } = require('lib/ui')
    , { Route } = require('lib/router')

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

      return h('div', [
        authority.title,
        h(Link, {
          href: Route('backend-authority-view', {
            backendID: backend.asIdentifier(),
            authorityID: authority.id
          })
        }, 'LINK')
      ])
    }
  }
}

const defaultOpts = {
  limit: 25,
  start: 0,
  selected: [],
  shownColumns: ['title', 'authors', 'yearPublished', 'numDefinitions'],
}


module.exports = makeList(
  'Authority List',
  'Selectable list of period authorities.',
  defaultOpts,
  R.map(R.prop('authority')),
  columns,
)
