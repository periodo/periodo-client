"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , tags = require('language-tags')
    , { Route } = require('org-shell')
    , { Box, Span, Pre } = require('./Base')
    , { Italic } = require('./Typography')
    , { Link, ExternalLink } = require('./Links')
    , { Map } = require('./Map')
    , { Diff, findChanges, showChanges } = require('./Diff')
    , { BackendContext } = require('./BackendContext')
    , { useContext } = require('react')
    , { Value } = require('./types')
    , linkifier = require('linkify-it')()
    , { permalinkURL } = require('../../periodo-app/src/globals')
    , util = require('periodo-utils')

const abbreviate = id => {
  try {
    return new URL(id).hostname.split('.').slice(-2)[0]
  } catch (e) {
    return 'invalid'
  }
}

const linkify = text => {
  const links = linkifier.match(text)

  if (! links) { return [ text ] }

  const nodes = []

  links.reverse().forEach(match => {
    const minusOne = ',;.'.indexOf(match.url.slice(-1)) !== -1
        , href = minusOne ? match.url.slice(0, -1) : match.url
        , lastIndex = minusOne ? match.lastIndex - 1 : match.lastIndex

    nodes.push(text.slice(0, match.index))
    nodes.push(h(ExternalLink, { href }, href))
    nodes.push(text.slice(lastIndex))
  })

  return nodes
}

const asYearOrRange = ({year, earliestYear, latestYear}) => year
  ? year
  : `${earliestYear}–${latestYear || ''}`

const describeLanguageTag = tag => tags(tag || '')
  .subtags()
  .map(t => `${t.descriptions()[0]}${t.type() === 'script' ? ' script' : ''}`)
  .join(', ')
  || 'unknown language'

const show = (component, props={}) => R.pipe(
  R.head,
  R.objOf('value'),
  R.merge(props),
  component
)

const entries = R.pipe(
  R.toPairs,
  R.map(Value.Anonymous)
)

function Annotated(props) {
  const { value, annotations } = props
  return h(
    Span,
    R.omit(['value', 'annotations'], props),
    [
      value,
      h(Italic, { ml: 1 }, R.intersperse(', ', annotations)),
    ]
  )
}

// Atomic values ---------------------------------------------------------------

function PrimitiveValue(props) {
  const { value } = props
  return h(Span, R.omit([ 'value' ], props), value)
}

function LinkValue(props) {
  const { value } = props
  return h(
    ExternalLink, R.merge(R.omit([ 'value' ], props), { href: value }), value
  )
}

function PermalinkValue(props) {
  const { value } = props

  return value.startsWith('p0')
    ? LinkValue({ ...props, value: `${ permalinkURL }${ value }`})
    : h(Italic, 'not yet assigned')
}

function RelatedPeriodValue(props) {
  const { value: period } = props
      , { backend } = useContext(BackendContext)

  return h(
    Link,
    {
      route: Route('period-view', {
        backendID: backend.asIdentifier(),
        authorityID: util.period.authorityOf(period).id,
        periodID: period.id,
      })
    },
    period.label
  )
}

function EntityValue(props) {
  const { value: { id, label }} = props
  return h(
    ExternalLink,
    R.merge(R.omit([ 'value' ], props), { href: id }),
    [
      h(Span, { fontSize: '12px' }, `${abbreviate(id)}:`),
      label
    ]
  )
}

function IntervalValue(props) {
  const { value } = props

  return h(
    Annotated,
    R.merge(
      R.omit([ 'value' ], props),
      {
        value: value.label,
        annotations: value.in ? [ asYearOrRange(value.in) ] : [ 'MISSING INTEGER VALUE' ]
      }
    )
  )
}

function LanguageTagValue(props) {
  const { value } = props
  return h(Span, R.omit([ 'value' ], props), describeLanguageTag(value))
}

function LanguageSpecificValue(props) {
  const { value: { value, language }} = props
  return h(
    Annotated,
    R.merge(
      R.omit([ 'value' ], props),
      { value, annotations: [ describeLanguageTag(language) ]}
    )
  )
}

function JSONLDContextEntryValue(props) {
  const { value: [ key, value ] } = props
  return h(
    Box,
    R.omit([ 'value' ], props),
    `  "${key}": ${JSON.stringify(value)}`
  )
}

// Diffable values -------------------------------------------------------------

function TextValue(props) {
  const { value: { text }, compare, links = false } = props
      , p = R.omit(['value', 'compare', 'links'], props)
  return compare
    ? h(Diff, R.merge(p, { value: text, compare: compare.text }))
    : h(Span, p, links ? linkify(text) : text)
}

function LinkifiedTextValue(props) {
  return TextValue(R.merge(props, { links: true }))
}

function AgentValue(props) {
  const { value: { id, name }, compare } = props

  if (R.isNil(name)) return null // sometimes names are missing

  const _props = R.omit([ 'value', 'compare' ], props)
      , child = compare ? h(Diff, { value: name, compare: compare.name }) : name

  return id
    ? h(ExternalLink, R.merge(_props, { href: id }), child)
    : h(Span, _props, child)
}

function SpatialExtentValue(props) {
  const { value: { description, places }, gazetteers, compare } = props
  return h(Box, [
    h(
      Annotated,
      R.merge(
        R.omit([ 'value', 'compare' ], props),
        compare
          ? { value:
                h(Diff, { value: description, compare: compare.description })
            , annotations:
                showChanges(EntityValue)(findChanges(places, compare.places))
            }
          : { value: description
            , annotations: R.map(show(EntityValue), places)
            }
      ),
    ),
    compare
      ? null
      : h(Map, {
        mt: 1,
        border: '1px solid #ccc',
        maxWidth: '650px',
        features: places.map(([{id}]) => gazetteers.find(id))
      })
  ])
}

function JSONLDContextValue(props) {
  const { value: { context }, compare } = props
  return compare
    ? h(
        Pre,
        R.omit([ 'value', 'compare' ], props),
        [
          '{',

          ...showChanges(JSONLDContextEntryValue)(
            findChanges(entries(context), entries(compare.context))
          ),

          '}'
        ]
      )
    : h(Pre, {}, JSON.stringify(context, null, '  '))
}

module.exports = {
  show,
  PrimitiveValue,
  LinkValue,
  PermalinkValue,
  IntervalValue,
  LanguageTagValue,
  LanguageSpecificValue,
  TextValue,
  LinkifiedTextValue,
  AgentValue,
  SpatialExtentValue,
  JSONLDContextValue,
  RelatedPeriodValue
}
