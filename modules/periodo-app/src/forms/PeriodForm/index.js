"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , LabelForm = require('./LabelForm')
    , { Flex, Box, Alert, Errors } = require('periodo-ui')
    , { SectionHeading, Section } = require('periodo-ui')
    , { InputBlock, TextareaBlock, Button } = require('periodo-ui')
    , RelatedPeriodsForm = require('./RelatedPeriodsForm')
    , TemporalCoverageForm = require('./TemporalCoverageForm')
    , SpatialCoverageForm = require('./SpatialCoverageForm')
    , Validated = require('../Validated')
    , { validatePeriod } = require('../validate')

const lenses = {
  url: R.lensProp('url'),
  locator: R.lensPath([ 'source', 'locator' ]),
  sameAs: R.lensProp('sameAs'),
  note: R.lensProp('note'),
  editorialNote: R.lensProp('editorialNote'),
}

const suggestPlaces = (authority, period) => {
  if (! period.spatialCoverageDescription) {
    return []
  }
  const scd = period.spatialCoverageDescription.trim()
  const coverage = Object.fromEntries(
    (period.spatialCoverage || []).map(({ id, label }) => [ id, label ])
  )
  const suggestions = Object.values(authority.periods)
    .filter(p => (p.spatialCoverageDescription || '').trim() === scd)
    .reduce((suggestions, p) => {
      for (const { id, label } of (p.spatialCoverage || [])) {
        if (! (Object.prototype.hasOwnProperty.call(coverage, id)
               || Object.prototype.hasOwnProperty.call(suggestions, id))) {
          suggestions[id] = label
        }
      }
      return suggestions
    }, {})
  return Object.entries(suggestions)
    .map(([ id, label ]) => ({
      id,
      label,
    }))
}

module.exports = Validated(validatePeriod, props => {
  const {
    value={},
    onValueChange=R.always(null),
    gazetteers,
    backendID,
    dataset,
    authority,
    errors,
    validate,
    onValidated,
    onCancel,
    onDelete,
    ...rest
  } = props

  const get = lens => R.view(lens, value) || ''
      , set = (lens, val) => onValueChange(R.set(lens, val, value))

  return (
    h(Box, {
      ...rest,
    }, [

      h(SectionHeading, 'Labels'),

      h(Section, [
        errors.label && Errors({ errors: errors.label }),

        h(LabelForm, {
          period: value,
          onValueChange,
        }),
      ]),

      h(SectionHeading, 'Related periods'),

      h(Section, [
        h(RelatedPeriodsForm, {
          value,
          onValueChange,
          backendID,
          dataset,
          authority,
        }),
      ]),

      h(SectionHeading, 'Spatial coverage'),

      h(Section, [
        h(SpatialCoverageForm, {
          onValueChange: R.pipe(
            R.merge(value),
            onValueChange
          ),
          description: value.spatialCoverageDescription,
          coverage: value.spatialCoverage,
          suggestions: suggestPlaces(authority, value),
          gazetteers,
        }),
      ]),

      h(SectionHeading, 'Temporal coverage'),

      h(Section, [
        errors.dates && Errors({ errors: errors.dates }),

        h(TemporalCoverageForm, {
          onValueChange: R.pipe(
            R.merge(value),
            onValueChange
          ),
          start: value.start,
          stop: value.stop,
        }),
      ]),

      h(SectionHeading, 'Additional source information'),

      h(Section, [
        h(InputBlock, {
          name: 'locator',
          label: 'Locator',
          helpText: 'Position within the source where this period is defined',
          placeholder: 'e.g. page 75',
          value: get(lenses.locator),
          onChange: e => set(lenses.locator, e.target.value),
        }),

        h(InputBlock, {
          mt: 3,
          name: 'url',
          label: 'URL',
          helpText: 'URL of a webpage defining this period',
          value: get(lenses.url),
          onChange: e => set(lenses.url, e.target.value.trim()),
        }),

        h(InputBlock, {
          mt: 3,
          name: 'sameAs',
          label: 'Same as',
          disabled: true,
          helpText: 'Non-PeriodO linked data identifier for this period (not editable)',
          value: get(lenses.sameAs),
          onChange: R.always(null),
        }),
      ]),

      h(SectionHeading, 'Notes'),

      h(Section, [
        h(TextareaBlock, {
          rows: 5,
          name: 'note',
          label: 'Note',
          helpText: 'Explanatory notes given in the original source',
          value: get(lenses.note),
          onChange: e => set(lenses.note, e.target.value),
        }),

        h(TextareaBlock, {
          mt: 3,
          rows: 5,
          name: 'editorial-note',
          label: 'Editorial note',
          helpText: 'Notes explaining your editorial decisions',
          value: get(lenses.editorialNote),
          onChange: e => set(lenses.editorialNote, e.target.value),
        }),
      ]),

      Object.keys(errors).length > 0
        ? h(Alert, {
          my: 3,
          variant: 'error',
          ml: 1,
        }, 'Please correct the errors above.')
        : null,

      h(Flex, {
        justifyContent: 'space-between',
      }, [
        h('div', [
          !onCancel ? null : (
            h(Button, {
              variant: 'danger',
              onClick: () => onCancel(),
            }, 'Cancel')
          ),
        ]),

        h('div', [
          !onDelete ? null : (
            h(Button, {
              variant: 'danger',
              onClick: () => onDelete(),
            }, 'Delete')
          ),
        ]),

        h('div', [
          h(Button, {
            variant: 'primary',
            onClick: () => validate(value, onValidated),
          }, 'Save'),
        ]),
      ]),
    ])
  )
})
