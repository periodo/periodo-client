"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , tags = require('language-tags')
    , { Route } = require('org-shell')
    , { Box, Span, Pre } = require('./Base')
    , { Italic } = require('./Typography')
    , { Link, ExternalLink } = require('./Links')
    , { WorldMap } = require('./WorldMap')
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

function asYearOrRange({ year, earliestYear, latestYear }) {
  return year != null
    ? year
    : `${earliestYear}–${latestYear || ''}`
}

function describeLanguageTag(tag) {
  return tags(tag || '')
    .subtags()
    .map(t => `${t.descriptions()[0]}${t.type() === 'script' ? ' script' : ''}`)
    .join(', ')
    || 'unknown language'
}

function show(Component, props={}) {
  return ([ value ]) =>
    h(Component, Object.assign({ value }, props))
}

const entries = R.pipe(
  R.toPairs,
  R.map(Value.Anonymous)
)

function Annotated(props) {
  const { value, annotations } = props
      , childProps = R.omit(['value', 'annotations'], props)

  return (
    h(Span, childProps, [
      value,
      h(Italic, { ml: 1 }, R.intersperse(', ', annotations)),
    ])
  )
}

// Atomic values ---------------------------------------------------------------

function PrimitiveValue(props) {
  const { value } = props
      , childProps = R.omit(['value'], props)

  return (
    h(Span, childProps, value)
  )
}

function LinkValue(props) {
  const { value } = props

  const childProps = Object.assign({}, {
    href: value,
  }, R.omit(['value', props]))

  return (
    h(ExternalLink, childProps, value)
  )
}

function PermalinkValue(props) {
  const { value } = props

  if (value.startsWith('p0')) {
    const childProps = Object.assign({}, props, {
      value: `${ permalinkURL }${ value }`,
    })

    return LinkValue(childProps)
  } else {
    return h(Italic, 'not yet assigned')
  }
}

function RelatedPeriodValue(props) {
  const { value: period } = props
      , { backend } = useContext(BackendContext)

  const childProps = {
    route: Route('period-view', {
      backendID: backend.asIdentifier(),
      authorityID: util.period.authorityOf(period).id,
      periodID: period.id,
    }),
  }

  return (
    h(Link, childProps, period.label)
  )
}

function EntityValue(props) {
  const { value: { id, label }} = props

  const childProps = Object.assign({}, R.omit(['value'], props), {
    href: id,
  })

  return (
    h(ExternalLink, childProps, [
      h(Span, { fontSize: '12px' }, `${abbreviate(id)}:`),
      label,
    ])
  )
}

function IntervalValue(props) {
  const { value } = props

  const childProps = Object.assign({}, R.omit(['value'], props), {
    value: value.label,
    annotations: value.in ? [ asYearOrRange(value.in) ] : [ 'MISSING INTEGER VALUE' ],
  })

  return (
    h(Annotated, childProps)
  )
}

function LanguageTagValue(props) {
  const { value } = props
      , childProps = R.omit(['value'], props)

  return (
    h(Span, childProps, describeLanguageTag(value))
  )
}

function LanguageSpecificValue(props) {
  const { value: { value, language }} = props

  const childProps = Object.assign(R.omit(['value'], props), {
    value,
    annotations: [ describeLanguageTag(language) ],
  })

  return (
    h(Annotated, childProps)
  )
}

function JSONLDContextEntryValue(props) {
  const { value: [ key, value ] } = props
      , childProps = R.omit(['value'], props)

  return (
    h(Box, childProps, [
      `  "${key}": ${JSON.stringify(value)}`,
    ])
  )
}

// Diffable values -------------------------------------------------------------

function TextValue(props) {
  const { value: { text }, compare, links = false } = props
      , childProps = R.omit(['value', 'compare', 'links'], props)

  if (compare) {
    return (
      h(Diff, Object.assign({}, childProps, {
        value: text,
        compare: compare.text,
      }))
    )
  }
  return (
    h(Span, childProps, [
      links ? linkify(text) : text,
    ])
  )
}

function LinkifiedTextValue(props) {
  return TextValue(Object.assign({}, props, { links: true }))
}

function AgentValue(props) {
  const { value: { id, name }, compare } = props

  if (name == null) return null

  const childProps = Object.assign(R.omit(['value', 'compare'], props), {
    children: compare
      ? h(Diff, { value: name, compare: compare.name })
      : name,
  })

  if (id) {
    return (
      h(ExternalLink, Object.assign({}, childProps, { href: id }))
    )
  }

  return (
    h(Span, childProps)
  )
}

function SpatialExtentValue(props) {
  const {
    value: { description, places },
    gazetteers,
    compare,
  } = props

  let annotationProps

  if (compare) {
    annotationProps = {
      value: h(Diff, { value: description, compare: compare.description }),
      annotations: showChanges(EntityValue)(findChanges(places, compare.places)),
    }
  } else {
    annotationProps = {
      value: description,
      annotations: R.map(show(EntityValue), places),
    }
  }

  const features = places
    .map(([{id}]) => gazetteers.find(id))
    .filter(R.identity)

  return (
    h('div', [
      h(Annotated, R.merge(
        R.omit([ 'value', 'compare' ], props),
        annotationProps
      )),
      compare ? null : (
        h(WorldMap, {
          mt: 1,
          border: '1px solid #ccc',
          maxWidth: '650px',
          features,
        })
      ),
    ])
  )
}

function JSONLDContextValue(props) {
  const { value: { context }, compare } = props
      , childProps = R.omit(['value', 'compare'], props)

  if (compare) {
    return (
      h(Pre, childProps, [
        '{',
        ...showChanges(JSONLDContextEntryValue)(
          findChanges(entries(context), entries(compare.context))
        ),
        '}',
      ])
    )
  }

  return (
    h(Pre, childProps, JSON.stringify(context, null, '  '))
  )
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
  RelatedPeriodValue,
}
