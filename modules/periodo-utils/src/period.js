"use strict";

const R = require('ramda')
    , { $$Authority } = require('./symbols')

function originalLabel(period) {
  const { label, languageTag } = period

  if(!label || !languageTag) return null;

  return {
    value: label,
    languageTag
  }
}

const allLabels = period =>
  [].concat(
    originalLabel(period),
    R.pipe(
      R.propOr({}, 'localizedLabels'),
      R.mapObjIndexed((labels, languageTag) =>
        labels.map(label => ({ value: label, languageTag }))),
      R.values,
      R.unnest
    )(period)
  )

function alternateLabels(period) {
  return R.without([originalLabel(period)], allLabels(period))
}

function authorityOf(period) {
  return R.prop($$Authority, period)
}

function periodWithAuthority(period) {
  return {
    period: R.path([$$Authority, 'definitions', period.id], period),
    authority: authorityOf(period),
  }
}

module.exports = {
  originalLabel,
  allLabels,
  alternateLabels,
  authorityOf,
  periodWithAuthority,
}
