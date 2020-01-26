"use strict";

const h = require('react-hyperscript')
    , { Box, Label, PlacesSelect } = require('periodo-ui')

const indexById = items => items.reduce(
  (index, item) => ({
    ...index,
    [item.id]: item,
  }),
  {}
)

const accepts = (filter, item) => {
  if (!filter) return true
  return item && item.id && filter.hasOwnProperty(item.id)
}

const PlaceFilter = ({
  opts,
  updateOpts,
  gazetteers,
}) => {

  const { filter } = opts

  return (
    h(Box, { pl: 2 }, [
      h(Label, 'Filter by place'),

      h(PlacesSelect, {
        onChange: places => updateOpts({
          ...opts,
          filter: places.length > 0 ? indexById(places) : null,
        }, true),
        coverage: filter ? Object.values(filter) : [],
        gazetteers,
        closable: true,
      }),
    ])
  )
}

module.exports = {
  label: 'Place filter',
  description: 'Set an optional filter for specific places',
  makeFilter(opts) {

    const filter = opts && opts.filter

    if (!filter) return null

    return period => {
      if (!period.spatialCoverage) return false
      for (const place of period.spatialCoverage) {
        if (accepts(filter, place)) return true
      }
      return false
    }
  },
  Component: PlaceFilter,
}
