"use strict";

const R = require('ramda')
    , { Result } = require('periodo-common')
    , { terminus } = require('periodo-utils')
    , { isLinkedData } = require('../linked-data/utils/source_ld_match')

function addError(obj, label, err) {
  return R.over(
    R.lensProp(label),
    (v=[]) => v.concat(err),
    obj
  )
}

const VALID_AUTHORITY_FIELDS = [
  'id',
  'source',
  'periods',
  'editorialNote',
  'sameAs',
]

const VALID_AUTHORITY_SOURCE_AGENT_FIELDS = [
  'contributors',
  'creators',
]

function validateAuthority(authority) {
  let errors = {}

  if (!authority.source || R.equals(authority.source, {})) {
    errors = addError(errors, 'source',
      'A source is required for an authority.')

  } else if (!isLinkedData(authority.source)) {
    if (!authority.source.citation && !authority.source.title) {
      errors = addError(errors, 'source',
        'Non linked data sources must have a citation or title.')
    }
  }

  if (R.equals(errors, {})) {
    const cleanedAuthority = {
      type: 'Authority',
      periods: {},
    }

    VALID_AUTHORITY_FIELDS.forEach(field => {
      const val = authority[field]

      if (val) {
        cleanedAuthority[field] = val
      }
    })

    const isLD = 'id' in cleanedAuthority.source

    if (!isLD) {
      VALID_AUTHORITY_SOURCE_AGENT_FIELDS.forEach(field => {
        const val = cleanedAuthority.source[field]

        if (val) {
          cleanedAuthority.source[field] = val.filter(agent => {
            const { name } = (agent || {})

            return name && name.trim().length > 0
          })
        }
      })
    }

    return Result.Ok(cleanedAuthority)

  } else {
    return Result.Err(errors)
  }
}

const VALID_PERIOD_FIELDS = [
  'id',
  'url',
  'sameAs',
  'source',
  'label',
  'language',
  'languageTag',
  'localizedLabels',
  'derivedFrom',
  'broader',
  'narrower',
  'spatialCoverage',
  'spatialCoverageDescription',
  'start',
  'stop',
  'note',
  'editorialNote',
]

const hasEnglishLabel = period => (
  period.localizedLabels &&
  period.localizedLabels.en &&
  period.localizedLabels.en.length > 0
)

const addLabel = (labelsByLanguage={}, label, languageTag) => ({
  ...labelsByLanguage,
  [languageTag]: Array.from(new Set([
    ...(labelsByLanguage[languageTag] || []),
    label,
  ])),
})

function validatePeriod(period) {
  let errors = {}

  if (!period.label) {
    errors = addError(errors, 'label', 'A period must have a label.');
  }

  if (period.languageTag !== 'en' && !hasEnglishLabel(period)) {
    errors = addError(
      errors,
      'label',
      'A period must have at least one English label.'
    )
  }

  // copy preferred label to localized labels
  period.localizedLabels = addLabel(
    period.localizedLabels,
    period.label,
    period.languageTag
  )

  const periodPresent = type =>
    R.prop(type, period) &&
    R.hasIn([ type, 'label' ]) &&
    terminus.earliestYear(R.prop(type, period)) !== null &&
    terminus.latestYear(R.prop(type, period)) !== null

  const badTerminusRange = t =>
    terminus.isMultipart(t) &&
    terminus.earliestYear(t) > terminus.latestYear(t)

  if (!periodPresent('start') || !periodPresent('stop')) {
    errors = addError(
      errors, 'dates', 'A period must have start and stop dates.'
    );
  } else if (
    terminus.latestYear(period.stop) < terminus.earliestYear(period.start)
  ) {
    errors = addError(
      errors, 'dates', 'A period\'s stop must come after its start.'
    );
  } else {
    if (badTerminusRange(period.start)) {
      errors = addError(
        errors, 'dates',
        'A period\'s latest start must come after its earliest start.'
      )
    }

    if (badTerminusRange(period.stop)) {
      errors = addError(
        errors, 'dates',
        'A period\'s latest stop must come after its earliest stop.'
      )
    }
  }

  // FIXME We could check here for cycles in derivedFrom and broader relations.
  // But for now it seems not worth the expense of checking the entire dataset.

  if (R.equals(errors, {})) {
    const cleanedPeriod = {
      type: 'Period',
    }

    VALID_PERIOD_FIELDS.forEach(field => {
      const val = period[field]

      if (val) {
        cleanedPeriod[field] = val;
      }
    })

    // Clean up parsed terminus labels
    delete cleanedPeriod.start._type;
    delete cleanedPeriod.stop._type;

    // Left-pad ISO years with zeroes
    terminus.ensureISOYear(cleanedPeriod.start)
    terminus.ensureISOYear(cleanedPeriod.stop)

    // Clean up related period arrays
    if (
      'derivedFrom' in cleanedPeriod
      && Array.isArray(cleanedPeriod.derivedFrom)
      && cleanedPeriod.derivedFrom.length === 0
    ) {
      delete cleanedPeriod.derivedFrom
    }
    if (
      'broader' in cleanedPeriod
      && Array.isArray(cleanedPeriod.broader)
    ) {
      if (cleanedPeriod.broader.length == 0) {
        delete cleanedPeriod.broader
      } else if (cleanedPeriod.broader.length == 1) {
        cleanedPeriod.broader = cleanedPeriod.broader[0]
      }
    }

    return Result.Ok(cleanedPeriod);

  } else {
    return Result.Err(errors);
  }
}

module.exports = {
  validateAuthority,
  validatePeriod,
}
