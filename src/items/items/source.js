"use strict";

const R = require('ramda')
    , { oneOf } = require('../utils')
    , { formatContributorList } = require('./contributor_seq')

const getCreators = R.pipe(
  oneOf(
    R.prop('creators'),
    R.path(['partOf', 'creators'])
  ),
  x => x || []
)

const getTitle = oneOf(
  R.prop('title'),
  R.prop('citation'),
  R.path(['partOf', 'title']),
  R.path(['partOf', 'citation'])
)

const getYearPublished = R.pipe(
  oneOf(
    R.prop('yearPublished'),
    R.path(['partOf', 'yearPublished'])
  ),
  v => v || null
)

function getDisplayTitle(source) {
  const creators = formatContributorList(getCreators(source))
      , year = getYearPublished(source)
      , title = getTitle(source)

  let ret = ''

  if (creators) {
    ret += creators;
    if (ret.slice(-1) !== '.') {
      ret += '. ';
    } else {
      ret += ' ';
    }
  }

  ret += title;

  if (ret.slice(-1) !== '.') {
    ret += '.'
  }

  if (year) {
    ret += ' ' + year + '.';
  }

  return ret;
}


module.exports = {
  getDisplayTitle,
  getCreators,
  getTitle,
  getYearPublished,
}
