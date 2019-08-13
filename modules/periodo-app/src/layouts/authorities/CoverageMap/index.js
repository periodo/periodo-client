"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Box, LabeledMap, PlaceSuggest, Tags } = require('periodo-ui')

const allFeatures = (periods, gazetteers) => periods.reduce(
  (featuresById, period) => {
    (period.spatialCoverage || [])
      .map(({ id }) => gazetteers.find(id))
      .filter(feature => feature && feature.id
              && !(featuresById.hasOwnProperty(feature.id)))
      .forEach(feature => featuresById[feature.id] = feature)
    return featuresById
  },
  {}
)

const accepts = (filter, item) => {
  if (!filter) return true
  return item && item.id && filter.hasOwnProperty(item.id)
}

const toggle = (filter, item) => {
  if (!item || !item.id) return filter
  const newFilter = { ...(filter || {}) }
  if (newFilter.hasOwnProperty(item.id)) {
    delete newFilter[item.id]
  } else {
    newFilter[item.id] = item
  }
  return (Object.keys(newFilter).length === 0)
    ? null
    : newFilter
}

const CoverageMap = ({ opts, updateOpts, data: periods, gazetteers }) => {

  const { filter } = opts

  const [ focusedFeature, setFocusedFeature ] = useState(undefined)

  return h(Box, {
    mt: 2,
  }, [
    filter
      ? h(Tags,
        {
          items: Object.values(filter),
          getItemLabel: feature => feature.properties.title,
          onFocus: feature => setFocusedFeature(feature),
          onBlur: () => setFocusedFeature(undefined),
          onDelete: feature => updateOpts({
            ...opts,
            filter: toggle(filter, feature),
          }, true),
        })
      : h(Box,
        {
          height: '24px',
          color: 'gray.6',
          css: {
            lineHeight: '24px',
            fontStyle: 'italic',
          },
        }, 'Showing all places. Search below for places to filter by'),

    h(LabeledMap, {
      focusedFeature,
      features: Object.values(filter || allFeatures(periods, gazetteers)),
      mt: 1,
    }),

    h(PlaceSuggest, {
      gazetteers,
      onSuggestionHighlighted:
        ({ suggestion }) => setFocusedFeature(suggestion),
      isSelected: feature => filter ? accepts(filter, feature) : false,
      onSelect: feature => updateOpts({
        ...opts,
        filter: toggle(filter, feature),
      }, true),
    }),
  ])
}

module.exports = {
  label: 'Spatial coverage map',
  description: 'WebGL map showing spatial coverage of selected periods',
  makeFilter(opts) {

    const filter = opts && opts.filter

    if (!filter) return null

    return period => {
      if (!period.spatialCoverage) return false
      for (const item of period.spatialCoverage) {
        if (accepts(filter, item)) return true
      }
      return false
    }
  },
  Component: CoverageMap,
}
