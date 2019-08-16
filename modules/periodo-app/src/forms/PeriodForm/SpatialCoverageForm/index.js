"use strict";

const h = require('react-hyperscript')
    , { Box, Text, InputBlock, Label } = require('periodo-ui')
    , { PlacesSelect } = require('periodo-ui')

const SpatialCoverageForm = ({
  onValueChange,
  description='',
  coverage=[],
  gazetteers,
}) => {

  return h(Box, [
    h(InputBlock, {
      mt: 2,
      name: 'description',
      label: 'Description',
      helpText:
        'A description of the spatial coverage as it appeared in the source',
      value: description,
      onChange: e => onValueChange({
        spatialCoverageDescription: e.target.value,
      }),
    }),

    h(Box, {
      mt: 2,
    }, [
      h(Label, {
        htmlFor: 'coverage-area',
      }, 'Coverage area'),

      h(Text, { mb: 1 },
        'A set of places that approximate the area of spatial coverage'),

      h(PlacesSelect, {
        onChange: places => onValueChange({ spatialCoverage: places }),
        places: coverage,
        gazetteers,
      }),
    ]),
  ])
}

module.exports = SpatialCoverageForm
