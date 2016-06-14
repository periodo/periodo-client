"use strict";

const Immutable = require('immutable')
    , { UNSENT } = require('./types').readyStates


exports.Backend = Immutable.Record({
  type: null,
  name: null,
  opts: Immutable.Map(),

  created: null,
  modified: null,
  accessed: null,
}, 'Backend');


exports.RequestedResource = Immutable.Record({
  readyState: UNSENT,
  payload: null,
  responseData: null,
  responseError: null,
}, 'RequestedResource');


Object.freeze(exports)
