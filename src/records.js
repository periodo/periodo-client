"use strict";

const Immutable = require('immutable')


exports.Backend = Immutable.Record({
  type: null,
  name: null,
  opts: Immutable.Map(),

  created: null,
  modified: null,
  accessed: null,
});


Object.freeze(exports)
