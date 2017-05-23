"use strict";

const Immutable = require('immutable')

function isLinkedData(source) {
  const { match } = require('../utils/source_ld_fetch')

  return !!match(source.get('id')) || !!match(source.getIn(['partOf', 'id'], ''));
}

module.exports = {
  isLinkedData,
}
