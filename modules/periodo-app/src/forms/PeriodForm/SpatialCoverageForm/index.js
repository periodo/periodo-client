"use strict";

const h = require('react-hyperscript')
    , { Box, HelpText, InputBlock, Label } = require('periodo-ui')
    , { PlacesSelect } = require('periodo-ui')

const SpatialCoverageForm = ({
  onValueChange,
  description='',
  coverage=[],
  suggestions=[],
  gazetteers,
}) => {

  return h(Box, [
    h(InputBlock, {
      name: 'description',
      label: 'Description',
      helpText:
        'Description of the spatial coverage as given in the original source',
      value: description,
      onChange: e => onValueChange({
        spatialCoverageDescription: e.target.value,
      }),
    }),

    h(Box, {
      mt: 3,
    }, [
      h(Label, {
        htmlFor: 'coverage-area',
      }, 'Coverage area'),

      h(HelpText,
        'Set of places that approximate the area of spatial coverage'),

      h(PlacesSelect, {
        onChange: places => onValueChange({ spatialCoverage: places }),
        coverage,
        suggestions,
        gazetteers,
      }),
    ]),
  ])
}

module.exports = SpatialCoverageForm
