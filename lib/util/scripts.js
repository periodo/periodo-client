"use strict";

// List of scripts from http://unicode.org/iso15924/iso15924-codes.html

const R = require('ramda')
    , isoScripts = require('../../assets/scripts.json')

let scripts

function getSortedList() {
  if (!scripts) {
    scripts = R.sortWith([
      R.ascend(R.prop('date')),
      R.ascend(R.prop('name'))
    ], isoScripts)
  }

  return scripts
}

module.exports = {
  getSortedList,
}
