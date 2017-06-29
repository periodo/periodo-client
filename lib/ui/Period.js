"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , tags = require('language-tags')
    , { Box } = require('axs-ui')
    , { Diff } = require('./Diff')
    , linkify = require('./linkify')

const Span = props => Box(
  R.merge(props, { is: 'span' })
)

const Italic = props => Span(
  R.merge(props, { css: {fontStyle: 'italic'} })
)

const Problem = props => Italic(
  R.merge(props, { color: 'red' })
)

const compareLists = ([ a, b ]) => {
  const deleted = R.difference(a, b)
      , added = R.difference(b, a)

  return R.map(
    v => [ v, R.contains(v, added), R.contains(v, deleted) ],
    R.union(a, b)
  )
}

const wrapValues = element => R.addIndex(R.map)(
  (value, i) => h(Box, { is: element, key: `v${i}` }, value)
)

const ensureProps = R.ifElse(R.is(String), R.objOf('children'), R.identity)

const checkRequired = isRequired => R.ifElse(
  R.both(R.isEmpty, R.always(isRequired)),
  R.always([ h(Problem, 'missing required value') ]),
  R.identity,
)

const diffValues = component => R.pipe(
  compareLists,
  R.map(
    ([ v, added, deleted ]) => {
      const color = (
        added ? Diff.colors.insert :
        deleted ? Diff.colors.delete :
        null
      )
      return h(component, R.merge(ensureProps(v), {backgroundColor: color}))
    }
  ),
)

const listValues = component => R.map(R.pipe(ensureProps, component))

const addChanges = values => R.pipe(
  R.zip(values),
  R.map(([ value, change ]) => R.merge(value, {changed: change}))
)

function Field(props) {
  const {
    label,
    values,
    valueComponent = Span,
    required = false,
    changed = {},
    diffInside = false,
  } = props

  const show = listValues(valueComponent)
  const compare = diffValues(valueComponent)
  const wrap = R.pipe(checkRequired(required), wrapValues('dd'))

  return h(
    Box,
    R.merge(
      R.omit(
        [ 'label', 'values', 'valueComponent',
          'required', 'changed', 'diffInside' ],
        props
      ),
      { key: label, mt: 1 }
    ),
    [
      h(Box, { is: 'dt', bold: true }, label),
      wrap(
        (changed.values === undefined)
          ? show(values)
          : diffInside
            ? show(addChanges(values)(changed.values))
            : compare([ values, changed.values ])
      )
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
            ? h(Diff, {pair: [description, changed.description]})
            : description
      , annotations:
          changed.places
            ? diffValues(Entity)([places, changed.places])
            : R.map(Entity, places)
      }
    ),
  )
}

function Text(props) {
  const { text, links = false, changed = {} } = props
      , otherProps = R.omit(['text', 'links', 'changed'], props)
  return changed.text
    ? h(Box, otherProps, h(Diff, {pair: [text, changed.text]}))
    : links
        ? h(Box, R.merge(otherProps,
            { dangerouslySetInnerHTML: { __html: linkify(text) }}
          ))
        : h(Box, otherProps, text)
}

const LinkifiedText = props => Text(R.merge(props, { links: true }))

function Link(props) {
  const { url } = props
  return h(Box, R.merge(R.omit(['url'], props), { is: 'a', href: url }), url)
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

const ensureArray = R.ifElse(Array.isArray, R.identity, Array.of)

const extract = keyOrPath => o => {
  const path = ensureArray(keyOrPath)
  const value = R.pathOr([], path, o)
  return ensureArray(value)
}

const extractAs = toKey => fromKeyOrPath => o => R.map(
  R.objOf(toKey),
  extract(fromKeyOrPath)(o)
)

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
    label: 'Original label',
    values: extractAs('text')('label'),
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
    values: extractAs('tag')('language'),
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
    values: extractAs('text')('note'),
    valueComponent: LinkifiedText,
    diffInside: true,
  },
  {
    label: 'Editorial notes',
    values: extractAs('text')('editorialNote'),
    valueComponent: LinkifiedText,
    diffInside: true,
  },
  {
    label: 'Locator',
    values: extract(['source', 'locator']),
  },
  {
    label: 'Web page',
    values: extractAs('url')('url'),
    valueComponent: Link
  },
  {
    label: 'Same as',
    values: extractAs('url')('sameAs'),
    valueComponent: Link,
  },
]

const getFields = period => R.pipe(
  R.map(field => R.assoc('values', field.values(period), field)),
  R.filter(({required, values}) => required || values.length > 0)
)

exports.Period = function Period(props) {
  const { period } = props
      , fields = getFields(period)(PERIOD_FIELDS)
  return h(
    Box,
    R.merge(R.omit(['period'], props), { is: 'dl' }),
    R.map(Field, fields)
  )
}

exports.PeriodDiff = function PeriodDiff({ periodA, periodB }) {
  const fieldsA = getFields(periodA)(PERIOD_FIELDS)
      , fieldsB = getFields(periodB)(PERIOD_FIELDS)
      , labelsA = R.map(R.prop('label'), fieldsA)
      , labelsB = R.map(R.prop('label'), fieldsB)
      , indexedFieldsA = R.indexBy(R.prop('label'), fieldsA)
      , indexedFieldsB = R.indexBy(R.prop('label'), fieldsB)

  const comparedFields = R.map(
    ([ label, added, deleted ]) => {
      if (added) {
        return R.merge(
          indexedFieldsB[label],
          { backgroundColor: Diff.colors.insert }
        )
      }
      if (deleted) {
        return R.merge(
          indexedFieldsA[label],
          { backgroundColor: Diff.colors.delete }
        )
      }
      return R.merge(
        indexedFieldsA[label],
        { changed: R.pick(['values'], indexedFieldsB[label]) }
      )
    },
    compareLists([ labelsA, labelsB ])
  )

  return h(
    Box,
    { is: 'dl' },
    R.map(Field, comparedFields),
  )
}
