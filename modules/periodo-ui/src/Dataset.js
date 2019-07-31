"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { FieldList, extract, extractIndexedValues, extractWithKey } = require('./diffable/Field')
    , { JSONLDContextValue } = require('./diffable/Value')
    , { Authority } = require('./Authority')

const DATASET_FIELDS = [
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
    getValues: extractWithKey('context')(extract('@context')),
    component: JSONLDContextValue,
    required: true,
    immutable: true,
    hidden: true,
  },
  { label: 'Authorities',
    getValues: extractIndexedValues('authorities'),
    component: props => h(
      Authority,
      R.merge(props,
        { m: 1, borderTop: 'thin solid', borderColor: 'Gainsboro' }
      ),
    ),
    hideUnchanged: true,
  },
]

exports.Dataset = FieldList(DATASET_FIELDS)
