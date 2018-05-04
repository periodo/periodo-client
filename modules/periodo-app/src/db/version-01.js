"use strict";

module.exports = function dbVersion1(db) {
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
