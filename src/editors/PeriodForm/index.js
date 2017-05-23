"use strict";

const h = require('react-hyperscript')
    , Immutable = require('immutable')
    , LabelForm = require('./LabelForm')
    , RandomID = require('../../utils/RandomID')
    , { Flex, Box, Label, Textarea } = require('axs-ui')
    , { InputBlock, Debug } = require('../../ui')
    , TemporalCoverageForm = require('./TemporalCoverageForm')

const PeriodForm = ({
  period=Immutable.Map({ type: 'PeriodDefinition' }),
  onValueChange,
  randomID,
}) =>
  h(Box, { border: 'black', p: 2 }, [
    h(Flex, [
      h(Box, { width: .5, pr: 1 }, [
        // this.renderError('label'),
        h(LabelForm, {
          period,
          onValueChange,
        })
      ]),

      h(Box, { width: .5, pl: 1 }, [
      /*
        h(InputBlock, {
          name: 'locator',
          label: 'Locator',
          placeholder: 'Position within the source (e.g. page 75)',
          value: period.getIn(['source', 'locator']),
          onChange: this.handleLocatorChange,
        }),
      */

        h(InputBlock, {
          name: 'url',
          label: 'URL',
          placeholder: 'URL for a webpage for this period',
          value: period.get('url'),
          onChange: e => {
            onValueChange(period.set('url', e.target.value))
          }
        }),

        h(InputBlock, {
          name: 'sameAs',
          label: 'Same as (not editable)',
          disabled: true,
          placeholder: 'Linked data for this period',
          value: period.get('sameAs'),
          onChange: () => null,
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
        // this.renderError('dates'),
        h(TemporalCoverageForm, {
          onValueChange: val => {
            onValueChange(period.merge(val))
          },
          start: period.get('start'),
          stop: period.get('stop'),
        })
      ])
    ]),

    h('h3', 'Notes'),
    h(Flex, [
      h(Box, { width: .5, pr: 1 }, [
        h(Label, { htmlFor: randomID('note') }, 'Note'),
        h(Textarea, {
          id: randomID('note'),
          value: period.get('note'),
          onChange: e => {
            onValueChange(period.set('note', e.target.value))
          },
          rows: 5
        }),
        h('p', 'Notes derived from the source'),
      ]),

      h(Box, { width: .5, pl: 1 }, [
        h(Label, { htmlFor: randomID('editorial-note') }, 'Editorial note'),
        h(Textarea, {
          id: randomID('editorial-note'),
          value: period.get('editorialNote'),
          onChange: e => {
            onValueChange(period.set('editorialNote', e.target.value))
          },
          rows: 5
        }),
        h('p', 'Notes about the import process'),
      ])
    ]),

    h(Debug, { period })
  ])

module.exports = RandomID(PeriodForm)