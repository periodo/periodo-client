"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { DiffableItem, extract } = require('./diffable/Field')
    , { ensureArray, period } = require('periodo-utils')
    , $$RelatedPeriods = Symbol.for('RelatedPeriods')

const {
  TextValue,
  LinkValue,
  PermalinkValue,
  IntervalValue,
  LanguageTagValue,
  LinkifiedTextValue,
  SpatialExtentValue,
  LanguageSpecificValue,
  RelatedPeriodValue,
  DownloadValue,
} = require('./diffable/Value')


const extractSpatialExtent = period => {
  const description = period.spatialCoverageDescription || ''
      , places = extract('spatialCoverage')(period)

  // return identified value so that it is diffable
  return (description || places.length)
    ? [{
      id: 0,
      description,
      places,
    }]
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
  ([ language, value ]) => ({
    language,
    value,
  }),
  R.difference( // exclude original label
    extractIndex('localizedLabels', period),
    [ R.pair(period.language, period.label) ]
  )
)

const extractRelatedPeriods = key => o => {
  if (! ($$RelatedPeriods in o)) {
    return []
  }
  if (! (key in o[$$RelatedPeriods])) {
    return []
  }
  const relatedPeriods = []
  const missingPeriods = []
  for (const [ id, relatedPeriod ] of
    Object.entries(o[$$RelatedPeriods][key])) {

    if (relatedPeriod) {
      relatedPeriods.push(relatedPeriod)
    } else {
      missingPeriods.push(id)
    }
  }
  return R.sort(period.byStartYear, relatedPeriods).concat(missingPeriods)
}

const periodFields = [
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
    label: 'Original label',
    getValues: extract('label', { withKey: 'text' }),
    component: TextValue,
    required: true,
  },

  {
    label: 'Part of',
    getValues: extractRelatedPeriods('broader'),
    component: RelatedPeriodValue,
  },
  {
    label: 'Has parts',
    getValues: extractRelatedPeriods('narrower'),
    component: RelatedPeriodValue,
  },
  {
    label: 'Derived from',
    getValues: extractRelatedPeriods('derivedFrom'),
    component: RelatedPeriodValue,
  },

  {
    label: 'Start',
    getValues: extract('start'),
    component: IntervalValue,
    required: true,
  },

  {
    label: 'Stop',
    getValues: extract('stop'),
    component: IntervalValue,
    required: true,
  },

  {
    label: 'Spatial coverage',
    getValues: extractSpatialExtent,
    useProps: [ 'gazetteers', 'showMap' ],
    component: SpatialExtentValue,
    required: true,
  },

  {
    label: 'Language',
    getValues: extract('languageTag'),
    component: LanguageTagValue,
    required: true,
  },

  {
    label: 'Alternate labels',
    getValues: extractAlternateLabels,
    component: LanguageSpecificValue,
  },

  {
    label: 'Notes from source',
    getValues: extract('note', { withKey: 'text' }),
    component: LinkifiedTextValue,
  },

  {
    label: 'Editorial notes',
    getValues: extract('editorialNote', { withKey: 'text' }),
    component: LinkifiedTextValue,
  },

  {
    label: 'Locator',
    getValues: extract([ 'source', 'locator' ]),
  },

  {
    label: 'Web page',
    getValues: extract('url'),
    component: LinkValue,
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

function Period(props) {
  return h(DiffableItem, {
    ...props,
    fieldList: periodFields,
  })
}

module.exports = { Period }
