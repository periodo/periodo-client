"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { useState } = require('react')
    , { Box, Text, InputBlock, Label, Tags } = require('periodo-ui')
    , LabeledMap = require('./LabeledMap')
    , PlaceSuggest = require('./PlaceSuggest')

const SpatialCoverageForm = ({
  onValueChange,
  description='',
  coverage=[],
  gazetteers,
}) => {

  const [focusedFeature, setFocusedFeature] = useState(undefined)

  const feature = id => R.path(gazetteers.index[id], gazetteers)

  const inCoverage = feature => R.any(item => item.id === feature.id, coverage)

  return h(Box, [
    h(InputBlock, {
      mt: 2,
      name: 'description',
      label: 'Description',
      helpText:
        'A description of the spatial coverage as it appeared in the source',
      value: description,
      onChange: e => onValueChange({
        spatialCoverageDescription: e.target.value
      })
    }),

    h(Box, {
      mt: 2,
    }, [
      h(Label, {
        htmlFor: 'coverage-area',
      }, 'Coverage area'),

      h(Text, { mb: 1 },
        'A set of places that approximate the area of spatial coverage'),

      R.isEmpty(coverage)
        ? h(Box, {
              height: '24px',
              color: 'gray.6',
              css: { lineHeight: '24px', fontStyle: 'italic' },
            }, 'Search below for places to add')
        : h(Tags, {
            items: coverage,
            onFocus: item => setFocusedFeature(feature(item.id)),
            onBlur: () => setFocusedFeature(undefined),
            onDelete: item => onValueChange(
              {spatialCoverage: R.without([item], coverage)})
        }),

      h(LabeledMap, {
        focusedFeature,
        features: coverage.map(({id}) => feature(id)),
        mt: 1,
      }),

      h(PlaceSuggest, {
        gazetteers,
        onSuggestionHighlighted:
          ({suggestion}) => setFocusedFeature(suggestion),
        isSelected: inCoverage,
        onSelect: feature => {
          const item = { id: feature.id, label: feature.properties.title }
          onValueChange({ spatialCoverage: inCoverage(item)
            ? R.without([item], coverage)
            : R.union(coverage, [item])
          })
        }
      })
    ])
  ])
}

module.exports = SpatialCoverageForm
