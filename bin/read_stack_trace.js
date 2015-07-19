#!/usr/bin/env node

"use strict";

var fs = require('fs')
  , stack = process.argv[2]
  , output = []
  , info
  , map


function getMapFromStack(stack) {
  var sourceMap = require('source-map')
    , mapFile

  mapFile = stack[0]
    .match(/periodo.*?\.js/)[0]
    .replace('.js', '.map')

  return new sourceMap.SourceMapConsumer(JSON.parse(fs.readFileSync('../dist/' + mapFile)))
}

stack = fs.readFileSync(stack, { encoding: 'utf-8' })
  .trim()
  .split('\n')

info = stack.splice(0, stack.indexOf('=========') + 1)
map = getMapFromStack(stack);

output = stack
  .map(function (row) {
    var match = row.match(/(\d+):(\d+)$/)
      , line = parseInt(match[1])
      , column = parseInt(match[2])

    return map.originalPositionFor({ column, line });
  })
  .map(function (mapped) {
    return `${mapped.name ? (mapped.name + '@') : ''}${mapped.source}:${mapped.line}:${mapped.column}`
  });

console.log(info.concat(output).join('\n'));
