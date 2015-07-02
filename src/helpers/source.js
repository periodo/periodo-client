"use strict";

var Immutable = require('immutable')


function isLinkedData(source) {
  var match = require('../utils/source_ld_fetch').match;
  return !!match(source.get('id')) || !!match(source.getIn(['partOf', 'id'], ''));
}

function getDisplayTitle(source) {
  var { formatContributorList } = require('./contributor_collection')
    , creators = formatContributorList(getCreators(source))
    , year = getYearPublished(source)
    , title = getTitle(source)
    , ret = ''

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

function getCreators(source) {
  return (
    source.get('creators') ||
    source.getIn(['partOf', 'creators']) ||
    Immutable.List()
  );
}

function getTitle(source) {
  return (
    source.get('title') ||
    source.get('citation') ||
    source.getIn(['partOf', 'title']) ||
    source.getIn(['partOf', 'citation'])
  )
}

function getYearPublished(source) {
  return (
    source.get('yearPublished') ||
    source.getIn(['partof', 'yearPublished']) ||
    null
  )
}

module.exports = {
  isLinkedData,
  getDisplayTitle,
  getCreators,
  getTitle,
  getYearPublished
}
