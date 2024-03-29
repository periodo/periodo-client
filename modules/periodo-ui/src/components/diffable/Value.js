"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , tags = require('language-tags')
    , { Route } = require('org-shell')
    , { Box, InlineText, Pre } = require('../Base')
    , { Italic } = require('../Typography')
    , { Link, ExternalLink } = require('../Links')
    , { WorldMap } = require('../WorldMap')
    , { Diff, findChanges, showChanges } = require('./Diff')
    , { BackendContext } = require('../BackendContext')
    , { useContext } = require('react')
    , { linkify } = require('../../util')
    , util = require('periodo-utils')

const abbreviate = id => {
  try {
    return new URL(id).hostname.split('.').slice(-2)[0]
  } catch (e) {
    return 'invalid'
  }
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
  return value =>
    h(Component, {
      value,
      ...props,
    })
}

const entries = R.pipe(
  R.toPairs,
  R.map(R.identity)
)

function Annotated(props) {
  const { value, annotations, ...childProps } = props

  return (
    h(InlineText, childProps, [
      value,
      h(Italic, { ml: 1 }, R.intersperse(', ', annotations)),
    ])
  )
}

// Atomic values ---------------------------------------------------------------

function PrimitiveValue(props) {
  const { value, ...childProps } = props

  return (
    h(InlineText, childProps, value)
  )
}

function LinkValue(props) {
  const { value, ...childProps } = props

  childProps.href = value

  return (
    h(ExternalLink, childProps, value)
  )
}

function PermalinkValue(props) {
  const { value } = props

  const permalink = util.permalink({ id: value })

  if (permalink) {
    const childProps = {
      ...props,
      value: permalink,
    }

    return LinkValue(childProps)
  } else {
    return h(Italic, { fontSize: 'small' }, 'not yet assigned')
  }
}

function DownloadValue(props) {
  const { value, includeCSV = false, ...childProps } = props

  const downloadURL= util.downloadURL({ id: value })

  const types = [
    {
      label: 'JSON',
      suffix: '.json',
    }, {
      label: 'Turtle',
      suffix: '.ttl',
    },
  ]

  if (includeCSV) {
    types.push({
      label: 'CSV',
      suffix: '.csv',
    })
  }

  if (downloadURL) {
    return h(InlineText, childProps,
      R.intersperse(', ', types.map(({ label, suffix }) => h(
        ExternalLink, { href: downloadURL + suffix }, label
      )))
    )
  } else {
    return h(Italic, { fontSize: 'small' }, 'not yet downloadable')
  }
}

function RelatedPeriodValue(props) {
  const { value } = props
      , { backend } = useContext(BackendContext)

  if (typeof(value) === 'object') {
    const period = value
    const authority = util.period.authorityOf(period)

    if (authority) {
      const childProps = {
        route: Route('period-view', {
          backendID: backend.asIdentifier(),
          authorityID: authority.id,
          periodID: period.id,
        }),
      }
      return h(Link, childProps, period.label)

    } else {
      return h(InlineText, {}, period.label)
    }

  } else {
    const url = util.downloadURL({ id: value })

    return url
      ? h(ExternalLink, { href: url }, url)
      : h(InlineText, {}, value)
  }
}

function RelatedAuthorityValue(props) {
  const { value: authority } = props
      , { backend } = useContext(BackendContext)

  const childProps = {
    route: Route('authority-view', {
      backendID: backend.asIdentifier(),
      authorityID: authority.id,
    }),
  }

  return (
    h(Link, childProps, util.authority.displayTitle(authority))
  )
}

function EntityValue(props) {
  const { value: { id, label }, ...childProps } = props

  childProps.href = id

  return (
    h(ExternalLink, childProps, [
      h(InlineText, { fontSize: '12px' }, `${abbreviate(id)}:`),
      label,
    ])
  )
}

function IntervalValue(props) {
  const { value, ...childProps } = props

  childProps.value = value.label

  childProps.annotations = value.in
    ? [ asYearOrRange(value.in) ]
    : [ 'MISSING INTEGER VALUE' ]

  return (
    h(Annotated, childProps)
  )
}

function LanguageTagValue(props) {
  const { value, ...childProps } = props

  return (
    h(InlineText, childProps, describeLanguageTag(value))
  )
}

function LanguageSpecificValue(props) {
  const { value: { value, language }, ...childProps } = props

  childProps.value = value;

  childProps.annotations = [ describeLanguageTag(language) ]

  return (
    h(Annotated, childProps)
  )
}

function JSONLDContextEntryValue(props) {
  const { value: [ key, value ], ...childProps } = props

  return (
    h(Box, childProps, [
      `  "${key}": ${JSON.stringify(value)}`,
    ])
  )
}

// Diffable values -------------------------------------------------------------

const WhitespacePreservedText = props =>
  h(InlineText, {
    sx: {
      whiteSpace: 'pre-line',
      wordBreak: 'break-word',
    },
    ...props,
  })

function TextValue(props) {
  const {
    value: { text },
    compare,
    links=false,
    ...childProps
  } = props

  if (compare) {
    return (
      h(Diff, {
        ...childProps,
        value: text,
        compare: compare.text,
      })
    )
  }

  return (
    h(WhitespacePreservedText, childProps, [
      links ? linkify(text) : text,
    ])
  )
}

function LinkifiedTextValue(props) {
  return TextValue({
    ...props,
    links: true,
  })
}

function AgentValue(props) {
  const { value: { id, name }, compare, ...childProps } = props

  if (name == null) return null

  childProps.children = compare
    ? h(Diff, {
      value: name,
      compare: compare.name,
    })
    : name

  if (id) {
    return (
      h(ExternalLink, {
        ...childProps,
        href: id,
      })
    )
  }

  return (
    h(InlineText, childProps)
  )
}

function SpatialExtentValue(props) {
  const {
    value: { description, places },
    gazetteers,
    showMap=false,
    compare,
  } = props

  let annotationProps
    , features

  if (compare) {
    annotationProps = {
      value: h(Diff, {
        value: description,
        compare: compare.description,
      }),
      annotations: showChanges(EntityValue)(findChanges(places, compare.places)),
    }
  } else {
    annotationProps = {
      value: description,
      annotations: R.map(show(EntityValue), places),
    }
  }

  if (showMap) {
    features = places
      .map(({ id }) => gazetteers.find(id))
      .filter(R.identity)
  }

  return (
    h('div', [
      h(Annotated, R.mergeRight(
        R.omit([ 'value', 'compare', 'showMap' ], props),
        annotationProps
      )),
      !showMap ? null : (
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
  const { value: { context }, compare, ...childProps } = props

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
  RelatedAuthorityValue,
  DownloadValue,
}
