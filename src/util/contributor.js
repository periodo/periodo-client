"use strict";

module.exports = {
  asString,
}

// Contributor -> String
function asString(contributor) {
  // FIXME: this sucks
  return contributor.name;
}

