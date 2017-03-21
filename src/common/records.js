"use strict";

const Immutable = require('immutable')
    , { UNSENT } = require('./types').readyStates

exports.RequestedResource = Immutable.Record({
  requestID: null,
  readyState: UNSENT,
  payload: null,
  responseData: null,
  responseError: null,
}, 'RequestedResource');
