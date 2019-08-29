"use strict";

const h = require('react-hyperscript')
    , { DiffableItem, extract } = require('./diffable/Field')
    , { LinkValue, PermalinkValue } = require('./diffable/Value')
    , { LinkifiedTextValue, DownloadValue } = require('./diffable/Value')
    , { Period } = require('./Period')
    , { Source } = require('./Source')

const authorityFields = [
  {
    label: 'Permalink',
    getValues: extract('id'),
    component: PermalinkValue,
    required: true,
    immutable: true,
  },

  {
    label: 'Type',
    getValues: extract('type'),
    required: true,
    immutable: true,
    hidden: true,
  },

  {
    label: 'Source',
    getValues: extract('source'),
    component: Source,
    nested: true,
    required: true,
  },

  {
    label: 'Editorial notes',
    getValues: extract('editorialNote', { withKey: 'text' }),
    component: LinkifiedTextValue,
  },

  {
    label: 'Same as',
    getValues: extract('sameAs'),
    component: LinkValue,
  },

  {
    label: 'Download',
    getValues: extract('id'),
    component: DownloadValue,
    required: true,
    immutable: true,
  },
]

const authorityFieldsWithPeriods = [
  ...authorityFields,

  {
    label: 'Periods',
    getValues: extract('periods', { indexed: true }),
    component: props => (
      h(Period, {
        ...props,
        m: 1,
        borderTop: 'thin solid',
        borderColor: 'Gainsboro',
      })
    ),
    hideUnchanged: true,
  },
]

function Authority(props) {
  return (
    h(DiffableItem, {
      ...props,
      fieldList: authorityFields,
    })
  )
}

function AuthorityWithPeriods(props) {
  return (
    h(DiffableItem, {
      ...props,
      fieldList: authorityFieldsWithPeriods,
    })
  )
}

module.exports = {
  Authority,
  AuthorityWithPeriods,
}
