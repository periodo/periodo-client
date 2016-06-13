"use strict";

const Dexie = require('dexie')
    , DB_NAME = '__PERIODO'


module.exports = function periodoDB(dexieOpts) {
  const db = new Dexie(DB_NAME, dexieOpts)

  db.version(1).stores({
    // All available backends
    backends: '++, &[name+type], created, modified, accessed',

    // Maps between local skolem IDs and permanent URIs on the server
    idbBackendIDMaps: '++, backendName, serverURL, localID',

    // Patches derived from changes in IDB backends
    idbBackendPatches: '++, backendName, created, *changeType, *affectedCollections, *affectedPeriods, *forwardHashes, *backwardHashes',


    // Patches submitted from a local dataset
    submittedPatches: 'url, resolved',

    // Cached triples from URLs
    linkedDataCache: 'url, *triples.subject, *triples.object',
  });

  return db;
}
