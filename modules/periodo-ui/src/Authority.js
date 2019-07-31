"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { FieldList, extract, extractIndexedValues, extractWithKey } = require('./diffable/Field')
    , { LinkValue, PermalinkValue, LinkifiedTextValue } = require('./diffable/Value')
    , { Period } = require('./Period')
    , { Source } = require('./Source')

const AUTHORITY_FIELDS = [
  {
    label: 'Permalink',
    values: extract('id'),
    component: PermalinkValue,
    required: true,
    immutable: true,
  },
  {
    label: 'Type',
    values: extract('type'),
    required: true,
    immutable: true,
    hidden: true,
  },
  {
    label: 'Source',
    values: extract('source'),
    component: Source,
    required: true,
  },
  {
    label: 'Editorial notes',
    values: extractWithKey('text')(extract('editorialNote')),
    component: LinkifiedTextValue,
  },
  {
    label: 'Same as',
    values: extract('sameAs'),
    component: LinkValue,
  },
]

const AUTHORITY_WITH_PERIODS_FIELDS = [
  ...AUTHORITY_FIELDS,
  { label: 'Periods',
    values: extractIndexedValues('periods'),
    component: props => h(
      Period,
      R.merge(props,
        { m: 1, borderTop: 'thin solid', borderColor: 'Gainsboro' }
      ),
    ),
    hideUnchanged: true,
  },
]

exports.Authority = FieldList(AUTHORITY_FIELDS)
exports.AuthorityWithPeriods = FieldList(AUTHORITY_WITH_PERIODS_FIELDS)
