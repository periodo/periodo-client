"use strict";

const R = require('ramda')
    , { Value, asValue } = require('./types')
    , { FieldList, extract, extractWithKey } = require('./Field')
    , { TextValue
      , LinkValue
      , PermalinkValue
      , IntervalValue
      , LanguageTagValue
      , LinkifiedTextValue
      , SpatialExtentValue
      , LanguageSpecificValue
      , RelatedPeriodValue,
      } = require('./Value')
    , { ensureArray, period } = require('periodo-utils')

const $$RelatedPeriods = Symbol.for('RelatedPeriods')

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

const extractRelatedPeriods = key => R.pipe(
  R.pathOr({}, [$$RelatedPeriods, key]),
  R.values,
  R.sort(period.byStartYear),
  R.map(asValue)
)

const PERIOD_FIELDS = [
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
    label: 'Original label',
    values: extractWithKey('text')(extract('label')),
    component: TextValue,
    required: true,
  },
  {
    label: 'Part of',
    values: extractRelatedPeriods('broader'),
    component: RelatedPeriodValue,
  },
  {
    label: 'Has parts',
    values: extractRelatedPeriods('narrower'),
    component: RelatedPeriodValue,
  },
  {
    label: 'Derived from',
    values: extractRelatedPeriods('derivedFrom'),
    component: RelatedPeriodValue,
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
    useProps: [ 'gazetteers' ],
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
    values: extractWithKey('text')(extract('note')),
    component: LinkifiedTextValue,
  },
  {
    label: 'Editorial notes',
    values: extractWithKey('text')(extract('editorialNote')),
    component: LinkifiedTextValue,
  },
  {
    label: 'Locator',
    values: extract(['source', 'locator']),
  },
  {
    label: 'Web page',
    values: extract('url'),
    component: LinkValue,
  },
  {
    label: 'Same as',
    values: extract('sameAs'),
    component: LinkValue,
  },
]

exports.Period = FieldList(PERIOD_FIELDS)
