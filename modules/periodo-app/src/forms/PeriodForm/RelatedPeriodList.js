"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Route } = require('org-shell')
    , { RandomID } = require('periodo-common')
    , { Flex, Box, Link, Text, Label } = require('periodo-ui')
    , { Autosuggest } = require('periodo-ui')
    , util = require('periodo-utils')

const spatialCoverageOf = period => period.spatialCoverageDescription
  ? period.spatialCoverageDescription
  : period.spatialCoverage
    ? period.spatialCoverage.map(place => place.label).join(', ')
    : 'unknown'

const temporalCoverageOf = period => `${
  period.start.label || util.terminus.asString(period.start)
} to ${
  period.stop.label || util.terminus.asString(period.stop)
}`

const escapeRegexCharacters = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const matcher = query => {
  const escapedQuery = escapeRegexCharacters(query.trim())
  if (escapedQuery === '') {
     // match everything on empty query
    return () => true
  }
  // match at beginnings of words
  const regex = new RegExp("(^|[\\s&'()-/:´-]+)" + escapedQuery, 'i')
  return s => regex.test(s)
}

const matches = query => {
  const matches = matcher(query)

  return (matched, period) => {
    if (! period) {
      return matched
    }
    for (const { label } of util.period.allLabels(period)) {
      if (matches(label)) {
        return matched.concat({
          ...period,
          name: `${label} (${spatialCoverageOf(period)})`
        })
      }
    }
    return matched
  }
}

const byName = R.comparator((a, b) => R.prop('name', a) < R.prop('name', b))

const getSuggestions = (authorities, suggestionFilter) => (query = '') => (
  authorities
    .map(authority => ({
      title: util.authority.displayTitle(authority),
      suggestions: Object.values(authority.periods)
        .reduce(matches(query), [])
        .filter(suggestionFilter)
        .sort(byName)
    }))
    .filter(section => section.suggestions.length > 0)
)

const renderSectionTitle = section =>
  h(Box, {
    px: 1,
    py: '6px',
    border: 1,
    borderColor: 'transparent',
    fontWeight: 'bold',
    css: {borderRadius: 1}
  }, [
    section.title
  ])

const renderSuggestion = (item, { isHighlighted }) => h(Box,
  Object.assign({
    pl: 3,
    pr: 1,
    py: '6px',
    border: 1,
    borderColor: 'transparent',
    css: {
      borderRadius: 1,
      cursor: 'pointer'
    },
  }, isHighlighted && { bg: 'gray.2' }), [
    item.name
  ]
)

const RelatedPeriod = ({
  period,
  backendID,
  ...props
}) => {

  const authority = util.period.authorityOf(period)

  return h(Box, props, [
    h(Link, {
      route: Route('period-view', {
        backendID,
        authorityID: authority.id,
        periodID: period.id,
      })
    }, util.period.originalLabel(period).label),
    h(Text, `${spatialCoverageOf(period)}, ${temporalCoverageOf(period)}`),
    h(Text, util.authority.displayTitle(authority))
  ])
}

const Deletable = ({ children, onDelete, ...props }) => h(Flex, {
  ...props
}, [
  h(Box, {
    flex: '0 0',
    mr: 2,
    color: 'gray.6',
    style: { cursor: 'pointer' },
    onClick: () => onDelete(),
  }, '✕'),

  h(Box, { flex: '1 1' }, children)
])

const RelatedPeriodList = ({
  name,
  label,
  helpText,
  periods,
  suggestionFilter=() => true,
  limit,
  authorities,
  backendID,
  onValueChange,
  randomID,
  ...props
}) => {

  const atLimit = limit && periods.length >= limit

  return h(Box, { css: { position: 'relative' }, ...props }, [
    h(Label, { htmlFor: randomID(name) }, label),

    helpText && h(Text, { size: 1, mb: 1 }, helpText),

    h(Box, { mt: -1, mb: '-1px' }, [
      periods.length
        ? periods.map(
            (period, key) => h(Deletable, {
              key,
              px: 1,
              py: 2,
              onDelete: () => onValueChange(
                periods.filter(({ id }) => id !== period.id)
              ),
              ...(atLimit ? {} : { borderBottom: '1px dotted #ced4da' }),
            }, [
                h(RelatedPeriod, { period, backendID })
              ]
            )
          )
        : h(Box, {
            py: 2,
            color: 'gray.6',
            css: { fontStyle: 'italic' },
          }, 'Search below for periods to add')
    ]),

    atLimit
      ? null
      : h(Autosuggest, {
          theme: {
            suggestionsContainer: {
              boxSizing: 'border-box',
              position: 'absolute',
              left: 0,
              right: 0,
            },
            suggestionsContainerOpen: {
              border: '1px solid #ccc',
              height: 164,
              boxShadow: '2px 1px 4px #ddd',
            }
          },
          multiSection: true,
          getSuggestions: getSuggestions(authorities, suggestionFilter),
          renderSectionTitle,
          renderSuggestion,
          getSectionSuggestions: section => section.suggestions,
          inputProps: {
            placeholder: 'Begin typing to search for periods to add',
            id: randomID(name),
            borderRadius: '0 0 2px 2px'
          },
          onSelect: period => onValueChange(periods.concat(period))
        })
  ])
}

module.exports = RandomID(RelatedPeriodList)
