"use strict";

var fs = require('fs')
  , peg = require('pegjs')
  , grammar = fs.readFileSync(__dirname + '/date_parser.pegjs', 'utf8')
  , options = { allowedStartRules: ['start', 'gregorianyear', 'bpyear', 'iso8601year'] }
  , parser = peg.buildParser(grammar, options)

module.exports = function (input, opts) {
  opts = opts || {};

  if (opts.throw) return parser.parse(input);

  try {
    return parser.parse(input);
  } catch (e) {
    return null;
  }
}
