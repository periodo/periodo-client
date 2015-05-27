"use strict";

var Immutable = require('immutable')
  , pointer = require('json-pointer')
  , jsonpatch = require('fast-json-patch')

module.exports = function (fromPeriod, patches) {
    var periodDiff = require('./period_diff')
      , truncatedPatches
      , toPeriod

    if (patches instanceof Immutable.Map) {
      patches = Immutable.List([patches]);
    }

    truncatedPatches = patches
      .map(patch => patch.update('path', path => {
        return pointer.compile(pointer.parse(path).slice(4))
      }))
      .toJSON()

    toPeriod = JSON.parse(JSON.stringify(fromPeriod));
    jsonpatch.apply(toPeriod, truncatedPatches);

    return periodDiff(fromPeriod, toPeriod);
}

