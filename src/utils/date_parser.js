var fs = require('fs')
  , peg = require('pegjs')
  , grammar = fs.readFileSync(__dirname + '/date_parser.pegjs', 'utf8')
  , options = { allowedStartRules: ['start', 'gregorianyear', 'bpyear', 'iso8601year'] }

module.exports = peg.buildParser(grammar, options);
