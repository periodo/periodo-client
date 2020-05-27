"use strict";

const h = require('react-hyperscript')
    , { Box, Label, PlacesSelect, HelpText } = require('periodo-ui')
    , { RandomID } = require('periodo-common')

const indexById = items => items.reduce(
  (index, item) => ({
    ...index,
    [item.id]: item,
  }),
  {}
)

const accepts = (filter, item) => {
  if (!filter) return true
  return (item &&
          item.id &&
          Object.prototype.hasOwnProperty.call(filter, item.id))
}

const PlaceFilter = ({
  opts,
  updateOpts,
  gazetteers,
  randomID,
}) => {

  const { filter } = opts
  const inputID = randomID('place-filter')

  return (
    h(Box, [
      h(Label, { htmlFor: inputID }, 'By place'),

      h(HelpText, 'Show periods linked to any of the selected places'),

      h(PlacesSelect, {
        onChange: places => updateOpts({
          ...opts,
          filter: places.length > 0 ? indexById(places) : null,
        }, true),
        coverage: filter ? Object.values(filter) : [],
        gazetteers,
        closable: true,
        inputProps: { id: inputID },
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
  Component: RandomID(PlaceFilter),
}
