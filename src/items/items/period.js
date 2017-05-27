"use strict";

const R = require('ramda')

function parseLang(langSpec) {
  const [ language, script ] = langSpec.split('-')

  return { language, script }
}

// Period -> String
function getOriginalLabel(period) {
  const { label, language } = period

  if(!label || !language) return null;

  return Object.assign({ value: label }, parseLang(language))
}


// Period -> OrderedSet<String>
const getAllLabels = R.pipe(
  R.propOr({}, 'localizedLabels'),
  R.mapObjIndexed((labels, isoCode) => labels.map(label =>
    Object.assign({ value: label }, parseLang(isoCode)))),
  R.values,
  R.unnest
)


// Period -> OrderedSet<String>
function getAlternateLabels(period) {
  return R.without([getOriginalLabel(period)], getAllLabels(period))
}

module.exports = {
  getOriginalLabel,
  getAllLabels,
  getAlternateLabels,
}
