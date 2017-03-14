"use strict";

const Dexie = require('dexie')
    , DB_NAME = '__PERIODO'


module.exports = function periodoDB(dexieOpts) {
  const db = new Dexie(DB_NAME, dexieOpts)

  db.version(1).stores({
    localBackends: `
      ++id,
      created,
      modified,
      accessed
    `,

    remoteBackends: 'url',

    // Patches derived from changes in IDB backends
    localBackendPatches: `
      ++,
      backendID,
      created,
      *changeType,
      *affectedCollections,
      *affectedPeriods,
      *forwardHashes,
      *backwardHashes
    `,

    // Patches submitted from a local dataset
    submittedPatches: 'url, backendName, resolved',

    // Cached triples from URLs
    linkedDataCache: 'url, *triples.subject, *triples.object',
  });

  return db;
}
