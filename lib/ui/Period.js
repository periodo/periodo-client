"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , tags = require('language-tags')
    , { Box } = require('axs-ui')
    , { Diff } = require('./Diff')
    , { FieldList, getFields, diffValues } = require('./Field')
    , { Span, Italic, Link, Text, LinkifiedText } = require('./Misc')
    , { extract, as, ensureArray } = require('../util/misc')

function AnnotatedValue(props) {
  const { value, annotations } = props
  return h(
    Span,
    R.omit(['value', 'annotations'], props),
    [
      value,
      h(Italic, {ml: 2}, R.intersperse(', ', annotations)),
    ]
  )
}

const abbreviate = id => {
  try {
    return new URL(id).hostname.split('.').slice(-2)[0]
  } catch (e) {
    return 'invalid'
  }
}

function Entity(props) {
  const { id, label } = props
  return h(
    Box,
    R.merge(props, { is: 'a', href: id }),
    [
      h(Span, { fontSize: 6 }, `${abbreviate(id)}:`),
      label
    ]
  )
}

function SpatialExtent(props) {
  const { description, places, changed = {} } = props
  return h(
    AnnotatedValue,
    R.merge(
      R.omit(['description', 'places', 'changed'], props),
      { value:
          changed.description
            ? h(Diff, { text: description, changed: changed.description })
            : description
      , annotations:
          changed.places
            ? diffValues(Entity)([places, changed.places])
            : R.map(Entity, places)
      }
    ),
  )
}

const asYearOrRange = ({year, earliestYear, latestYear}) => year
  ? year
  : `${earliestYear}–${latestYear || ''}`

function Interval(props) {
  return h(
    AnnotatedValue,
    R.merge(
      R.omit(['label', 'in'], props),
      { value: props.label
      , annotations: [ asYearOrRange(props.in) ]
      }
    )
  )
}

const describeLanguageTag = tag => tags(tag || '')
  .subtags()
  .map(t => `${t.descriptions()[0]}${t.type() === 'script' ? ' script' : ''}`)
  .join(', ')
  || 'unknown language'

function Language(props) {
  const { tag } = props
  return h(
    Span,
    R.omit(['tag'], props),
    describeLanguageTag(tag)
  )
}

function LanguageSpecificString(props) {
  const { language, value } = props
  return h(
    AnnotatedValue,
    R.merge(R.omit(['language', 'value'], props),
      { value
      , annotations: [ describeLanguageTag(language) ]
      }
    )
  )
}

const projectKeys = R.pipe(
  R.toPairs,
  R.map(([ k, v ]) => [ k, ensureArray(v) ]),
  R.chain(([ k, vs ]) => vs.map(R.pair(k))),
)

const extractLanguageSpecificValues = R.pipe(
  R.ifElse(Array.isArray, R.pathOr({}), R.propOr({})),
  projectKeys,
)

const extractSpatialCoverage = period => {
  const [ description ] = extract('spatialCoverageDescription')(period)
      , places = extract('spatialCoverage')(period)
  if (description || places.length) {
    return [{ description, places }]
  }
  return []
}

const extractAlternateLabels = period => R.map(
  ([ language, value ]) => ({ language, value }),
  R.difference( // exclude original label
    extractLanguageSpecificValues('localizedLabels', period),
    R.zip(extract('language')(period), extract('label')(period))
  )
)

const PERIOD_FIELDS = [
  {
    label: 'Permalink',
    values: as('url')(extract('id')),
    valueComponent: Link,
    required: true,
    immutable: true,
  },
  {
    label: 'Type',
    values: extract('Type'),
    required: true,
    immutable: true,
    hidden: true,
  },
  {
    label: 'Original label',
    values: as('text')(extract('label')),
    valueComponent: Text,
    required: true,
    diffInside: true,
  },
  {
    label: 'Start',
    values: extract('start'),
    valueComponent: Interval,
    required: true,
  },
  {
    label: 'Stop',
    values: extract('stop'),
    valueComponent: Interval,
    required: true,
  },
  {
    label: 'Spatial coverage',
    values: extractSpatialCoverage,
    valueComponent: SpatialExtent,
    required: true,
  },
  {
    label: 'Language',
    values: as('tag')(extract('language')),
    valueComponent: Language,
    required: true,
  },
  {
    label: 'Alternate labels',
    values: extractAlternateLabels,
    valueComponent: LanguageSpecificString,
  },
  {
    label: 'Notes from source',
    values: as('text')(extract('note')),
    valueComponent: LinkifiedText,
    diffInside: true,
  },
  {
    label: 'Editorial notes',
    values: as('text')(extract('editorialNote')),
    valueComponent: LinkifiedText,
    diffInside: true,
  },
  {
    label: 'Locator',
    values: extract(['source', 'locator']),
  },
  {
    label: 'Web page',
    values: as('url')(extract('url')),
    valueComponent: Link
  },
  {
    label: 'Same as',
    values: as('url')(extract('sameAs')),
    valueComponent: Link,
  },
]

const fields = getFields(PERIOD_FIELDS)

exports.Period = function Period(props) {
  const { period, changed = {} } = props
  return h(
    FieldList,
    R.merge(
      R.omit(['period', 'changed'], props),
      { fields: fields(period)
      , changed: changed.period ? { fields: fields(changed.period) } : {}
      }
    ),
  )
}
