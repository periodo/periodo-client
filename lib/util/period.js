"use strict";

const R = require('ramda')
    , { $$Authority } = require('./symbols')

function parseLang(langSpec) {
  const [ language, script ] = langSpec.split('-')

  return { language, script }
}

function originalLabel(period) {
  const { label, language } = period

  if(!label || !language) return null;

  return Object.assign({ value: label }, parseLang(language))
}

const allLabels = R.pipe(
  R.propOr({}, 'localizedLabels'),
  R.mapObjIndexed((labels, isoCode) => labels.map(label =>
    Object.assign({ value: label }, parseLang(isoCode)))),
  R.values,
  R.unnest
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
