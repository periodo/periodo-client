"use strict";

// List of scripts from http://unicode.org/iso15924/iso15924-codes.html

var Immutable = require('immutable')
  , isoScripts = require('../../lib/scripts.json')

isoScripts = Immutable.fromJS(isoScripts)
  .sort((b, a) => {
    var aDate = parseInt(a.get('date').replace('-', ''))
      , bDate = parseInt(b.get('date').replace('-', ''))

    if (bDate > aDate) {
      return 1;
    } else if (bDate === aDate) {
      return 0;
    } else {
      return -1;
    }
  });

module.exports = isoScripts;
