"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box, Span, Autosuggest } = require('periodo-ui')

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

  return (matched, feature) => {
    if (! (feature && feature.properties)) {
      return matched
    }
    if (matches(feature.properties.title)) {
      return R.append({
        ...feature,
        name: feature.properties.title,
      }, matched)
    }
    if (! feature.names) {
      return matched
    }
    for (const name of feature.names) {
      if (matches(name.toponym)) {
        return R.append({
          ...feature,
          name: name.toponym,
        }, matched)
      }
    }
    return matched
  }
}

const getSuggestions = gazetteers => (query = '') => gazetteers
  .map(gazetteer => ({
    title: gazetteer.title,
    suggestions: gazetteer.features.reduce(matches(query), []),
  }))
  .filter(section => section.suggestions.length > 0)

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
    h(Span, {
      display: 'inline-block',
      width: '1em',
      color: 'gray.6',
    }, isSelected ? '✓' : ' '),
    item.name,
  ]
)

const PlaceSuggest = ({
  gazetteers,
  onSuggestionHighlighted,
  isSelected,
  onSelect,
}) => h(Box, {
  border: 1,
  borderColor: 'gray.4',
  borderRadius: '0 0 2px 2px',
  pt: '2px',
  css: { position: 'relative' },
}, [
  h(Autosuggest, {
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
    getSuggestions: getSuggestions(gazetteers),
    shouldRenderSuggestions: value => value.trim().length > 0,
    highlightFirstSuggestion: false,
    renderSectionTitle,
    renderSuggestion: (item, info) => renderSuggestion(
      item, {
        isSelected: isSelected(item),
        ...info,
      }
    ),
    getSectionSuggestions: section => section.suggestions,
    inputProps: {
      id: 'coverage-area',
      border: 'none',
    },
    onSuggestionHighlighted,
    onSelect,
  }),
])

module.exports = PlaceSuggest
