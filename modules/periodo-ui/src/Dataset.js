"use strict";

const h = require('react-hyperscript')
    , { DiffableItem, extract } = require('./diffable/Field')
    , { JSONLDContextValue } = require('./diffable/Value')
    , { Authority } = require('./Authority')

const datasetFields = [
  {
    label: 'Permalink',
    getValues: extract('id'),
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
    label: 'Context',
    getValues: extract('@context', { withKey: 'context' }),
    component: JSONLDContextValue,
    required: true,
    immutable: true,
    hidden: true,
  },

  {
    label: 'Authorities',
    getValues: extract('authorities', { indexed: true }),
    component: props => (
      h(Authority, {
        ...props,
        m: 1,
        borderTop: 'thin solid',
        borderColor: 'Gainsboro',
      })
    ),
    hideUnchanged: true,
  },
]

function Dataset(props) {
  return (
    h(DiffableItem, {
      ...props,
      fieldList: datasetFields,
    })
  )
}

module.exports = { Dataset }
