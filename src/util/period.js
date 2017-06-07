"use strict";

const R = require('ramda')

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

module.exports = {
  originalLabel,
  allLabels,
  alternateLabels,
}
