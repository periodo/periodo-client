"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , LabelForm = require('./LabelForm')
    , { Flex, Box, Heading } = require('periodo-ui')
    , { InputBlock, TextareaBlock, Button$Primary, Errors } = require('periodo-ui')
    , RelatedPeriodsForm = require('./RelatedPeriodsForm')
    , TemporalCoverageForm = require('./TemporalCoverageForm')
    , SpatialCoverageForm = require('./SpatialCoverageForm')
    , Validated = require('../Validated')
    , { validatePeriod } = require('../validate')

const lenses = {
  url: R.lensProp('url'),
  locator: R.lensPath(['source', 'locator']),
  sameAs: R.lensProp('sameAs'),
  note: R.lensProp('note'),
  editorialNote: R.lensProp('editorialNote'),
}

module.exports = Validated(validatePeriod, props => {
  const {
    value={},
    onValueChange=R.always(null),
    dataset,
    authority,
    errors,
  } = props

  const get = lens => R.view(lens, value) || ''
      , set = (lens, val) => onValueChange(R.set(lens, val, value))

  return (
    h(Box, {}, [
      h(Box, {
        py: 2,
        px: 3,
        border: 1,
        borderColor: '#ccc',
        css: {
          borderRadius: '6px 6px 0 0',
        },
        bg: 'gray.0',
      }, [
        h(Heading, {
          level: 3,
        }, 'Add period'),
      ]),

      h(Box, {
        css: {
          borderLeft: '1px solid #ccc',
          borderRight: '1px solid #ccc',
        }
      }, [
        h(Flex, {
          css: {
            borderBottom: '1px solid #ccc',
          }
        }, [
          h(Box, { width: .5, px: 3, py: 2, }, [
            errors.label && Errors({ errors: errors.label }),

            h(LabelForm, {
              period: value,
              onValueChange,
            })
          ]),

          h(Box, { width: .5, px: 3, py: 2, }, [
            h(InputBlock, {
              name: 'locator',
              label: 'Locator',
              placeholder: 'Position within the source (e.g. page 75)',
              value: get(lenses.locator),
              onChange: e => set(lenses.locator, e.target.value)
            }),

            h(InputBlock, {
              mt: 2,
              name: 'url',
              label: 'URL',
              placeholder: 'URL for a webpage for this period',
              value: get(lenses.url),
              onChange: e => set(lenses.url, e.target.value)
            }),

            h(InputBlock, {
              mt: 2,
              name: 'sameAs',
              label: 'Same as (not editable)',
              disabled: true,
              placeholder: 'Linked data for this period',
              value: get(lenses.sameAs),
              onChange: R.always(null),
            })
          ]),
        ]),

        h(Heading, { level: 3, px: 3, py: 2 }, 'Related periods'),

        h(RelatedPeriodsForm, {
          value,
          onValueChange,
          dataset,
          authority,
          pb: 2,
          borderBottom: '1px solid #ccc'
        }),

        h(Flex, {
          css: {
            borderBottom: '1px solid #ccc',
          }
        }, [
          h(Box, { width: .5, px: 3, py: 2, }, [
            h(Heading, { level: 3 }, 'Spatial coverage'),
            h(SpatialCoverageForm, {
              onValueChange: R.pipe(
                R.merge(value),
                onValueChange
              ),
              description: value.spatialCoverageDescription,
              coverage: value.spatialCoverage,
            })
          ]),

          h(Box, { width: .5, px: 3, py: 2, }, [
            h(Heading, { level: 3 }, 'Temporal coverage'),

            errors.dates && Errors({ errors: errors.dates }),

            h(TemporalCoverageForm, {
              onValueChange: R.pipe(
                R.merge(value),
                onValueChange
              ),
              start: value.start,
              stop: value.stop,
            })
          ])
        ]),

        h(Flex, [
          h(TextareaBlock, {
            px: 3,
            py: 2,
            width: .5,
            rows: 5,

            name: 'note',
            label: 'Note',
            helpText: 'Notes derived from the source',
            value: get(lenses.note),
            onChange: e => set(lenses.note, e.target.value),
          }),

          h(TextareaBlock, {
            px: 3,
            py: 2,
            width: .5,
            rows: 5,

            name: 'editorial-note',
            label: 'Editorial note',
            helpText: 'Notes about the import process',
            value: get(lenses.editorialNote),
            onChange: e => set(lenses.editorialNote, e.target.value),
          })
        ]),
      ]),

      h(Box, {
        bg: 'gray0',
        p: 2,
        border: 1,
        borderColor: '#ccc',
        css: {
          borderRadius: '0 0 6px 6px',
        },
      }, [
        h(Button$Primary, {
          onClick: () => props.validate(value, props.onValidated)
        }, 'Save'),
      ]),
    ])
  )
})
