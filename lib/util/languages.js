"use strict";

const R = require('ramda')

let languages

function getSortedList() {
  if (!languages) {
    languages = R.toPairs(require('iso-639-3').all())
      .map(([code, val]) => Object.assign({ code }, val))
      .sort((b, a) => {
        if (a.name === 'English') {
          return 2;
        } else if (a.iso6391 && !b.iso6391) {
          return 1;
        } else if (a.iso6392T && !b.iso6392T) {
          return 1;
        } else if (!a.iso6391 && !a.iso6392T && !b.iso6391 && !b.iso6392T) {
          return 0;
        } else {
          return -1;
        }
    })
  }

  return languages
}

module.exports = {
  getSortedList,
}
