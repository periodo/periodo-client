"use strict";

module.exports = function dbVersion2(db) {
  db.version(2).stores({
    localBackends: `
      ++id,
      created,
      modified,
      accessed
    `,

    remoteBackends: 'url',

    settings: `++id`,

    // Patches derived from changes in IDB backends
    localBackendPatches: `
      ++id,
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
  })
}
