"use strict";

const Immutable = require('immutable')

exports.Backend = Immutable.Record({
  type: null,
  name: null,
  data: null,
  modified: null,
});

Object.freeze(exports)
