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

  db.on('populate', function () {
    db.remoteBackends.add({
      label: 'Canonical',
      description: 'The canonical PeriodO dataset',
      url: 'https://test.perio.do/',

      // FIXME: These are lies! But there's no way to know the latter two
      // until a request to the server has actually been made, and the type
      // definition says that they must be dates. It's not a big deal, but
      // this is a note for later.
      created: new Date(),
      modified: new Date(),
      accessed: new Date(),
    })
  })

  db.open()

  return db;
}
