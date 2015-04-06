"use strict";

var fs = require('fs')
  , peg = require('pegjs')
  , jsonpatch = require('fast-json-patch')
  , grammar = fs.readFileSync(__dirname + '/patch_parser.pegjs', 'utf8')
  , parser = peg.buildParser(grammar)

module.exports = {

  // Necessary because jsonpatch.compare has side effects :(
  makePatch: function (before, after) {
    return jsonpatch.compare(JSON.parse(JSON.stringify(before)), after);
  },

  // Returns the IDs of each periodCollection edited in each patch array passed
  getAffectedPeriodizations: function () {
    var regex = /^\/periodCollections\/([^\/]+)/;
    return Array.prototype.slice.call(arguments)
      .reduce(function (acc, arr) { return acc.concat(arr) }, [])
      .map(function (patch) {
        var match = patch.path.match(regex);
        return match && match[1].replace(/~1/g, '/').replace(/~0/g, '~');
      })
      .reduce(function (acc, uri) {
        if (uri && acc.indexOf(uri) === -1) {
          acc.push(uri);
        }
        return acc;
      }, []);
  },

  classifyDiff: function (diff) {
    var path = typeof diff === 'object' ? diff.path : diff
      , changedAttr

    if (path === '/id' || path === '/primaryTopicOf') {
      return null;
    }

    try {
      changedAttr = parser.parse(path);
    } catch (e) {
      throw new Error('could not parse ' + path);
    }

    return changedAttr;
  }
}
