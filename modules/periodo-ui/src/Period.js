"use strict";

const R = require('ramda')
    , { Value } = require('./types')
    , { FieldList, extract, as } = require('./Field')
    , { TextValue
      , LinkValue
      , IntervalValue
      , LanguageTagValue
      , LinkifiedTextValue
      , SpatialExtentValue
      , LanguageSpecificValue
      } = require('./Value')
    , { ensureArray } = require('periodo-utils')

const extractSpatialExtent = period => {
  const description = period.spatialCoverageDescription || ''
      , places = extract('spatialCoverage')(period)

  return (description || places.length)
    // return identified value so that it is diffable
    ? [ Value.Identified({ id: 0, description, places }) ]
    : []
}

const projectKeys = R.pipe(
  R.toPairs,
  R.map(([ k, v ]) => [ k, ensureArray(v) ]),
  R.chain(([ k, vs ]) => vs.map(R.pair(k))),
)

const extractIndex = R.pipe(
  R.propOr({}),
  projectKeys,
)

const extractAlternateLabels = period => R.map(
  ([ language, value ]) => Value.Anonymous({ language, value }),
  R.difference( // exclude original label
    extractIndex('localizedLabels', period),
    [ R.pair(period.language, period.label) ]
  )
)

const PERIOD_FIELDS = [
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
    hidden: true,
  },
  {
    label: 'Original label',
    values: as('text')(extract('label')),
    component: TextValue,
    required: true,
  },
  {
    label: 'Start',
    values: extract('start'),
    component: IntervalValue,
    required: true,
  },
  {
    label: 'Stop',
    values: extract('stop'),
    component: IntervalValue,
    required: true,
  },
  {
    label: 'Spatial coverage',
    values: extractSpatialExtent,
    component: SpatialExtentValue,
    required: true,
  },
  {
    label: 'Language',
    values: extract('languageTag'),
    component: LanguageTagValue,
    required: true,
  },
  {
    label: 'Alternate labels',
    values: extractAlternateLabels,
    component: LanguageSpecificValue,
  },
  {
    label: 'Notes from source',
    values: as('text')(extract('note')),
    component: LinkifiedTextValue,
  },
  {
    label: 'Editorial notes',
    values: as('text')(extract('editorialNote')),
    component: LinkifiedTextValue,
  },
  {
    label: 'Locator',
    values: extract(['source', 'locator']),
  },
  {
    label: 'Web page',
    values: extract('url'),
    component: LinkValue
  },
  {
    label: 'Same as',
    values: extract('sameAs'),
    component: LinkValue,
  },
]

exports.Period = FieldList(PERIOD_FIELDS)
