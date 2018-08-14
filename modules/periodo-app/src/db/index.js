"use strict";

const Dexie = require('dexie')
    , DB_NAME = '_PERIODO'

module.exports = function periodoDB(dexieOpts) {
  const db = new Dexie(DB_NAME, dexieOpts)

  require('./version-01')(db)
  require('./version-02')(db)
  require('./version-03')(db)
  require('./version-04')(db)

  db.on('populate', function () {
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

    db.settings.add({})
  })

  db.open()

  return db;
}
