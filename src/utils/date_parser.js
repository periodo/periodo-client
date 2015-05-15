"use strict";

var fs = require('fs')
  , peg = require('pegjs')
  , grammar = fs.readFileSync(__dirname + '/date_parser.pegjs', 'utf8')
  , options = { allowedStartRules: ['start', 'gregorianyear', 'bpyear', 'iso8601year'] }
  , parser = peg.buildParser(grammar, options)

function parse(input, opts) {
  opts = opts || {};

  if (opts.throw) return parser.parse(input, opts);

  try {
    return parser.parse(input, opts);
  } catch (e) {
    return null;
  }
}

parse._parser = parser;

module.exports = parse
