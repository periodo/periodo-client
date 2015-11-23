#!/usr/bin/env node

"use strict";

var fs = require('fs')
  , url = require('url')
  , path = require('path')
  , https = require('https')


const BASE_URL = 'https://api.github.com/repos/periodo/periodo-client'
    , VERSION = require('../package.json').version
    , ZIPFILE_NAME = `periodo-${VERSION}.zip`
    , VERSION_ZIPFILE = path.join(__dirname, '..', 'dist', ZIPFILE_NAME)
    , TAG = 'v' + VERSION
    , TOKEN = fs.readFileSync(`${process.env.HOME}/.githubtoken`)


Promise.all([tagExists(), releaseDoesNotExist(), releaseZipExists()])
  .then(() => console.log('OK'))
  .then(postRelease)
  .then(postZip)
  .catch(err => {
    process.stderr.write('Could not release version. Details:\n\n');
    process.stderr.write(err.stack || err);
    process.stderr.write('\n\n');
  });


function postRelease() {
  var opts = url.parse(`${BASE_URL}/releases`)
    , data = JSON.stringify({ 'tag_name': TAG, 'name': TAG })

  opts.method = 'POST';
  opts.headers = {
    'Authorization': `token ${TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'node.js',
    'Content-Length': data.length
  }

  return new Promise((resolve, reject) => {
    var req = https.request(opts, res => {
      if (res.statusCode === 201) {
        resolve(res.headers.Location)
      } else {
        reject('Bad status code: ' + res.statusCode);
      }
    });

    req.on('error', reject);
    req.end();
  });
}

function postZip(releaseURL) {
  var opts = url.parse(releaseURL + `/assets?name=zipFilename`)

  opts.method = 'POST';
  opts.headers = {
    'Authorization': `token ${TOKEN}`,
    'Content-Type': 'application/zip',
    'User-Agent': 'node.js'
  }

  return new Promise((resolve, reject) => {
    var req = https.request(opts, res => {
      if (res.statusCode === 201) resolve();
      else reject('Failed to upload zip.');
    });

    fs.createReadStream(VERSION_ZIPFILE).pipe(req);
    req.end();
  });
}

function releaseZipExists() {
  return new Promise((resolve, reject) => {
    try {
      fs.statSync(VERSION_ZIPFILE);
      resolve();
    } catch (e) {
      reject(`Zip for ${VERSION} does not exist in dist/`);
    }
  });
}

function releaseDoesNotExist() {
  var opts = url.parse(`${BASE_URL}/releases/tags/${TAG}`)

  opts.headers = {
    'User-Agent': 'node.js'
  }

  return new Promise((resolve, reject) => {
    https.get(opts, res => {
      if (res.statusCode === 404) resolve();
      else if (res.statusCode === 200) reject(`Tag ${TAG} already has an associated version.`);
      else reject(`Problem detecting if release exists (${res.statusCode})`)
    });
  });
}

function tagExists() {
  var opts = url.parse(`${BASE_URL}/git/refs/tags/${TAG}`)

  opts.headers = {
    'User-Agent': 'node.js'
  }

  return new Promise((resolve, reject) => {
    https.get(opts, res => {
      if (res.statusCode === 200) resolve();
      else if (res.statusCode === 404) reject(`Tag ${TAG} does not exist.`);
      else reject(`Problem detecting if tag exists (${res.statusCode})`)
    }).on('error', reject);
  });
}
