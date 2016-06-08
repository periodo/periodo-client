const Dexie = require('dexie')
    , { Backend } = require('./records')
    , DB_NAME = '__PERIODO'

let db = null


module.exports = function periodoDB(dexieOpts) {
  if (!db) db = initialize(dexieOpts);

  return db;
}


function initialize(dexieOpts) {
  const db = new Dexie(DB_NAME, dexieOpts)

  db.version(1).stores({
    // All available backends
    backends: '++, &[name+type], created, modified, accessed',

    /*
    backendDatasets: '++, &[name+type]',
    */

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
