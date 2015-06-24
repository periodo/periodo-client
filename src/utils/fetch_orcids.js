"use strict";

var N3 = require('n3')

// Returns a promise that resolves to an object whose keys are the given
// ORCIDs, and whose values are names resolved to them.
module.exports = function (orcids) {
  var ld = require('../linked_data_cache')
    , store = N3.Store()

  return Promise.all(orcids.map(orcid => ld.get(orcid)))
    .then(orcidLDEntities => orcidLDEntities
      .reduce((acc, { url, triples, prefixes }) => {
        var fullName = ''
          , givenName
          , familyName

        store.addTriples(triples);
        store.addPrefixes(prefixes);

        givenName = store.find(url, 'foaf:givenName', null);
        if (givenName.length) {
          givenName = N3.Util.getLiteralValue(givenName[0].object);
          fullName += (givenName + ' ');
        }

        familyName = store.find(url, 'foaf:familyName', null);
        if (familyName.length) {
          familyName = N3.Util.getLiteralValue(familyName[0].object);
          fullName += familyName;
        }

        acc[url] = fullName ? fullName.trim() : url;
        return acc;
      }, {})
    )
}
