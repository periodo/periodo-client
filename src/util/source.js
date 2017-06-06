"use strict";

const R = require('ramda')
    , { oneOf } = require('./misc')
    , contributorList = require('./contributor_list')

function isLinkedData(source) {
  const match = require('../linked-data/utils/source_ld_match')

  return !!match(R.path(['id'], source)) || !!match(R.path(['partOf', 'id'], source) || '');
}

const creators = R.pipe(
  oneOf(
    R.prop('creators'),
    R.path(['partOf', 'creators'])
  ),
  x => x || []
)

const title = oneOf(
  R.prop('title'),
  R.prop('citation'),
  R.path(['partOf', 'title']),
  R.path(['partOf', 'citation'])
)

const yearPublished = R.pipe(
  oneOf(
    R.prop('yearPublished'),
    R.path(['partOf', 'yearPublished'])
  ),
  v => v || null
)

function displayTitle(source) {
  const _creators = contributorList.asString(creators(source))
      , year = yearPublished(source)
      , _title = title(source)

  let ret = ''

  if (_creators) {
    ret += _creators;
    if (ret.slice(-1) !== '.') {
      ret += '. ';
    } else {
      ret += ' ';
    }
  }

  ret += _title;

  if (ret.slice(-1) !== '.') {
    ret += '.'
  }

  if (year) {
    ret += ' ' + year + '.';
  }

  return ret;
}


module.exports = {
  displayTitle,
  creators,
  title,
  yearPublished,
  isLinkedData,
}
