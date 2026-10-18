"use strict";

const test = require('blue-tape')
    , { BackendBackup } = require('../types')
    , backupData = require('./backup.json')

test('Creating a backup from a file', async t => {
  t.doesNotThrow(() => {
    BackendBackup.fromObject(backupData)
  }, 'should construct a backend')
})
