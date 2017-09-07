"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { FieldList, extract, extractIndexedValues, as } = require('./Field')
    , { JSONLDContextValue } = require('./Value')
    , { Authority } = require('./Authority')

const DATASET_FIELDS = [
  {
    label: 'Permalink',
    values: extract('id'),
    required: true,
    immutable: true
  },
  {
    label: 'Type',
    values: extract('type'),
    required: true,
    immutable: true,
    hidden: true
  },
  {
    label: 'Context',
    values: as('context')(extract('@context')),
    component: JSONLDContextValue,
    required: true,
    immutable: true,
    hidden: true
  },
  { label: 'Authorities',
    values: extractIndexedValues('periodCollections'),
    component: props => h(
      Authority,
      R.merge(props,
        { m: 1, borderTop: 'thin solid', borderColor: 'Gainsboro' }
      ),
    ),
    hideUnchanged: true
  },
]

exports.Dataset = FieldList(DATASET_FIELDS)
