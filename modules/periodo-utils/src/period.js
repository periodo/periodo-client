"use strict";

const R = require('ramda')
    , { earliestYear } = require('./terminus')
    , { $$Authority } = require('./symbols')

function originalLabel(period) {
  const { label, languageTag } = period

  if (!label || !languageTag) return null;

  return {
    label,
    languageTag,
  }
}

const allLabels = period =>
  [].concat(
    originalLabel(period),
    R.pipe(
      R.propOr({}, 'localizedLabels'),
      R.mapObjIndexed((labels, languageTag) =>
        labels.map(label => ({
          label,
          languageTag,
        }))),
      R.values,
      R.unnest
    )(period)
  )

function alternateLabels(period) {
  return R.without([ originalLabel(period) ], allLabels(period))
}

function authorityOf(period) {
  return R.prop($$Authority, period)
}

function periodWithAuthority(period) {
  return {
    period: R.path([ $$Authority, 'periods', period.id ], period),
    authority: authorityOf(period),
  }
}

const byStartYear = R.comparator(
  (a, b) => earliestYear(a.start) < earliestYear(b.start)
)

module.exports = {
  originalLabel,
  allLabels,
  alternateLabels,
  authorityOf,
  periodWithAuthority,
  byStartYear,
}
