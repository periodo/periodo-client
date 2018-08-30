"use strict";

const Dexie = require('dexie')
    , DB_NAME = '_PERIODO'

module.exports = function periodoDB(dexieOpts) {
  const db = new Dexie(DB_NAME, dexieOpts)

  require('./version-01')(db)
  require('./version-02')(db)
  require('./version-03')(db)
  require('./version-04')(db)

  db.on('populate', () => {
    if (global.DEFAULT_PERIODO_BACKENDS) {
      [].concat(global.DEFAULT_PERIODO_BACKENDS).forEach(backend => {
        db.remoteBackends.add(Object.assign({}, backend, {
          // FIXME: These are lies! But there's no way to know the latter two
          // until a request to the server has actually been made, and the type
          // definition says that they must be dates. It's not a big deal, but
          // this is a note for later.
          created: new Date(),
          modified: new Date(),
          accessed: new Date(),
        }))

      })
    }

    if (global.location && global.location.hostname.startsWith('client.')) {
      const backend = {
        url: global.location.hostname.replace('client.', 'data.'),

        // See above
        created: new Date(),
        modified: new Date(),
        accessed: new Date(),
      }

      if (global.location.hostname === 'client.perio.do') {
        backend.label = 'Canonical'
        backend.description = 'The canonical PeriodO dataset'
      } else {
        backend.label = 'Current host'
        backend.description = 'The PeriodO dataset hosted alongside this client'
      }

      db.remoteBackends.add(backend)
    }

    db.settings.add({})
  })

  db.open()

  return db;
}
