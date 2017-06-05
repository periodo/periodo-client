"use strict";

// List of scripts from http://unicode.org/iso15924/iso15924-codes.html

const isoScripts = require('../../lib/scripts.json')

let scripts

function getSortedList() {
  if (!scripts) {
    scripts = isoScripts
      .sort((b, a) => {
        const aDate = parseInt(a.date).replace('-', '')
            , bDate = parseInt(b.date).replace('-', '')

        if (bDate > aDate) {
          return 1;
        } else if (bDate === aDate) {
          return 0;
        } else {
          return -1;
        }
      });
  }

  return scripts
}

module.exports = {
  getSortedList,
}
