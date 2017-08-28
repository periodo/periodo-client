"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { Box, Text } = require('axs-ui')
    , { InputBlock, Label, Autosuggest, AriaButton } = require('periodo-ui')
    , countries = require('../../../assets/dbpedia_countries.json')

module.exports = ({
  onValueChange,
  description='',
  coverage=[],
}) =>
  h(Box, [
    h(InputBlock, {
      mt: 2,
      name: 'description',
      label: 'Description',
      helpText: 'A description of the spatial coverage as it appeared in the source',
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

      h(Text, { mb: '4px', }, 'Entities that estimate the area spatial coverage of this period'),

      h(Box, { css: { position: 'relative' }}, [
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
            }
          },
          items: countries,
          inputProps: {
            id: 'coverage-area',
          },
          onSelect: val => onValueChange({
            spatialCoverage: R.union(coverage, [{
              id: val.id,
              label: val.name,
            }])
          })
        })
      ]),

      h(Box, { is: 'ul', p: 0, css: { listStyleType: 'none' }}, coverage.map(item =>
        h(Box, {
          is: 'li',
          fontSize: 4,
          key: item.id,
        }, [
          h(AriaButton, {
            color: 'red',
            px: '4px',
            mr: '2px',
            mt: 1,
            css: {
              display: 'inline-block',
              ':hover': {
                cursor: 'pointer',
                background: 'red',
                color: 'white',
              }
            },
            onSelect: () => onValueChange({
              spatialCoverage: R.without([item], coverage),
            }),
          }, '✕'),

          item.label
        ])
      ))
    ]),
  ])
