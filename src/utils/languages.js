"use strict";

var Immutable = require('immutable')
  , languages

languages = Immutable.fromJS(require('iso-639-3').all())
  .map((val, code) => val.set('code', code))
  .toList()
  .sort((b, a) => {
    if (a.get('name') === 'English') {
      return 2;
    } else if (a.get('iso6391') && !b.get('iso6391')) {
      return 1;
    } else if (a.get('iso6392T') && !b.get('iso6392T')) {
      return 1;
    } else if (!a.get('iso6391') && !a.get('iso6392T') && !b.get('iso6391') && !b.get('iso6392T')) {
      return 0;
    } else {
      return -1;
    }
  });

module.exports = languages;
