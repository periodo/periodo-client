"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Route } = require('org-shell')
    , { RandomID } = require('periodo-common')
    , { Box, Link, Text, HelpText, Label, InlineText, Tag } = require('periodo-ui')
    , { Autosuggest, BackendContext } = require('periodo-ui')
    , util = require('periodo-utils')
    , { useContext } = require('react')

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
          name: `${label} (${spatialCoverageOf(period)})`,
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
        .sort(byName),
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
    css: { borderRadius: 1 },
  }, [
    section.title,
  ])

const renderSuggestion = (item, { isHighlighted, isSelected }) => h(Box,
  {
    px: 1,
    py: '6px',
    border: 1,
    borderColor: 'transparent',
    css: {
      borderRadius: 1,
      cursor: 'pointer',
    },
    ...isHighlighted && { bg: 'gray.2' },
  }, [
    h(InlineText, {
      display: 'inline-block',
      width: '1em',
      color: 'gray.6',
    }, isSelected ? '✓' : ' '),
    item.name,
  ]
)

const RelatedPeriod = ({
  period,
  ...props
}) => {
  const authority = util.period.authorityOf(period)
      , { backend } = useContext(BackendContext)

  return h(Box, {
    display: 'inline-block',
    ...props,
  }, [
    h(Link, {
      route: Route('period-view', {
        backendID: backend.asIdentifier(),
        authorityID: authority.id,
        periodID: period.id,
      }),
    }, period.label),
    h(Text, `${spatialCoverageOf(period)}, ${temporalCoverageOf(period)}`),
    h(Text, util.authority.displayTitle(authority)),
  ])
}

const RelatedPeriodList = ({
  name,
  label,
  helpText,
  periods,
  suggestionFilter=() => true,
  limit,
  authorities,
  onValueChange,
  randomID,
  ...props
}) => {

  const atLimit = limit && periods.length >= limit

  const isSelected = item => R.any(period => period.id === item.id, periods)

  return (
    h(Box, {
      css: {
        position: 'relative',
      },
      ...R.omit([ 'backendID' ], props),
    }, [
      h(Label, { htmlFor: randomID(name) }, label),

      helpText && h(HelpText, helpText),

      h(Box, { as: 'ol' }, [
        periods.length
          ? periods.map(
            (period, index) => h(Tag, {
              key: `related-period-${index}`,
              label: h(RelatedPeriod, { period }),
              mr: 1,
              mb: 1,
              onDelete: () => onValueChange(
                periods.filter(({ id }) => id !== period.id)
              ),
            })
          )
          : null,
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
            },
          },
          multiSection: true,
          getSuggestions: getSuggestions(authorities, suggestionFilter),
          renderSectionTitle,
          renderSuggestion: (item, info) => renderSuggestion(
            item, {
              isSelected: isSelected(item),
              ...info,
            }
          ),
          getSectionSuggestions: section => section.suggestions,
          inputProps: {
            placeholder: 'Begin typing to search for periods to add',
            id: randomID(name),
          },
          onSelect: item => onValueChange(isSelected(item)
            ? periods.filter(({ id }) => id !== item.id)
            : periods.concat(item)
          ),
        }),
    ])
  )
}

module.exports = RandomID(RelatedPeriodList)
