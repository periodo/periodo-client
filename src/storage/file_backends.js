"use strict";

var Dexie = require('dexie')
  , openedDB

function initDB() {
  var db = new Dexie('_file_backends')

  db.version(1).stores({
    files: 'id++,&name,filename'
  });

  db.open();

  return db;
}

function getDB() {
  if (!openedDB) openedDB = initDB();
  return openedDB;
}

// Returns a promise that resolves to a list of filenames
function listFiles() {
  return getDB().files.orderBy('name').uniqueKeys();
}

function getUniqueName(filename, existingNames, copy=0) {
  var candidate = copy === 0 ? filename : `${filename} (${copy})`;
  return existingNames.indexOf(candidate) === -1 ?
    candidate :
    getUniqueName(filename, existingNames, copy + 1)
}

// Returns a promise that will resolve to a file object
function getFile(name) {
  return getDB().files
    .where('name')
    .equals(name)
    .first()
    .then(file => {
      if (!file) throw new Error(`Could not find file ${file}`);

      return file;
    });
}

function addFile(filename, data) {
  var db = getDB()
    , fileData

  if (typeof data !== 'object') {
    throw new Error('Must pass data for file object');
  }

  return db.transaction('rw', db.files, () => {
    listFiles()
      .then(names => getUniqueName(filename, names))
      .then(name => (fileData = { name, filename, data }))
      .then(() => getDB().files.add(fileData))
  }).then(() => fileData);
}

function deleteFile(filename) {
  return getDB().files
    .where('name')
    .equals(filename)
    .delete()
}

module.exports = { listFiles, getFile, addFile, deleteFile }
