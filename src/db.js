"use strict";

const Dexie = require('dexie')
    , DB_NAME = '__PERIODO'


module.exports = function periodoDB(dexieOpts) {
  const db = new Dexie(DB_NAME, dexieOpts)

  db.version(1).stores({
    // All available backends
    backends: `
      ++id,
      &[name+type],
      created,
      modified,
      accessed
    `,

    // Patches derived from changes in IDB backends
    backendDatasetPatches: `
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
    submittedPatches: 'url, resolved',

    // Cached triples from URLs
    linkedDataCache: 'url, *triples.subject, *triples.object',
  });

  return db;
}
