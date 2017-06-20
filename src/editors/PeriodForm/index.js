"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , LabelForm = require('./LabelForm')
    , { Flex, Box } = require('axs-ui')
    , { InputBlock, TextareaBlock } = require('lib/ui')
    , TemporalCoverageForm = require('./TemporalCoverageForm')
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
  const { value={}, onValueChange=R.always(null) } = props

  const get = lens => R.view(lens, value) || ''
      , set = (lens, val) => onValueChange(R.set(lens, val, value))

  return (
    h(Box, { border: 'black', p: 2 }, [
      h(Flex, [
        h(Box, { width: .5, pr: 1 }, [
          h(LabelForm, {
            period: value,
            onValueChange,
          })
        ]),

        h(Box, { width: .5, pl: 1 }, [
          h(InputBlock, {
            name: 'locator',
            label: 'Locator',
            placeholder: 'Position within the source (e.g. page 75)',
            value: get(lenses.locator),
            onChange: e => set(lenses.locator, e.target.value)
          }),

          h(InputBlock, {
            name: 'url',
            label: 'URL',
            placeholder: 'URL for a webpage for this period',
            value: get(lenses.url),
            onChange: e => set(lenses.url, e.target.value)
          }),

          h(InputBlock, {
            name: 'sameAs',
            label: 'Same as (not editable)',
            disabled: true,
            placeholder: 'Linked data for this period',
            value: get(lenses.sameAs),
            onChange: R.always(null),
          })
        ]),
      ]),

      h(Flex, [
        h(Box, { width: .5, pr: 1 }, [
          h('h3', 'Spatial coverage'),
        /*
          h(SpatialCoverageForm, {
            onValueChange: this.handleValueChange,
            description: period.get('spatialCoverageDescription'),
            coverage: period.get('spatialCoverage'),
            coverageDescriptionSet: spatialCoverages
          })
        */
        ]),

        h(Box, { width: .5, pl: 1 }, [
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

      h('h3', 'Notes'),
      h(Flex, [
        h(TextareaBlock, {
          pr: 1,
          width: .5,
          rows: 5,

          name: 'note',
          label: 'Note',
          helpText: 'Notes derived from the source',
          value: get(lenses.note),
          onChange: e => set(lenses.note, e.target.value),
        }),

        h(TextareaBlock, {
          pr: 1,
          width: .5,
          rows: 5,

          name: 'editorial-note',
          label: 'Editorial note',
          helpText: 'Notes about the import process',
          value: get(lenses.editorialNote),
          onChange: e => set(lenses.editorialNote, e.target.value),
        })
      ]),
    ])
  )
})
