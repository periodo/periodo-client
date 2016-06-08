"use strict";

const Immutable = require('immutable')


exports.Backend = Immutable.Record({
  type: null,
  name: null,
  opts: Immutable.Map(),

  created: null,
  modified: null,
  accesssed: null,
});


Object.freeze(exports)
