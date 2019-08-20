"use strict";

module.exports = function dbVersion2(db) {
  db.version(4).stores({
    localBackends: `
      ++id,
      created,
      modified,
      accessed
    `,

    remoteBackends: 'url',

    fileBackends: '++id',

    settings: `++id`,

    // Patches derived from changes in IDB backends
    localBackendPatches: `
      ++id,
      backendID,
      created,
      *changeType,
      *affectedAuthorities,
      *affectedPeriods,
      *forwardHashes,
      *backwardHashes
    `,

    // Patches submitted from a local dataset
    patchSubmissions: 'patchURL, backendID, resolved',

    // Cached triples from URLs
    linkedDataCache: 'url, *triples.subject, *triples.object',
  })
}
