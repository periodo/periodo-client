"use strict";

var jsonpatch = require('fast-json-patch')

module.exports = {

  // Necessary because jsonpatch.compare has side effects :(
  makePatch: function (before, after) {
    return jsonpatch.compare(JSON.parse(JSON.stringify(before)), after);
  },

  // Returns the IDs of each periodization edited in each patch array passed
  getAffectedPeriodizations: function () {
    var regex = /^\/periodizations\/([^\/]+)/;
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
  }
}
