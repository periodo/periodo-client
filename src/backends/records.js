"use strict";

const Immutable = require('immutable')

exports.Backend = Immutable.Record({
  id: null,

  type: null,
  label: null,
  description: null,
  url: null,

  created: null,
  modified: null,
  accessed: null,
}, 'Backend');
