"use strict";

var fs = require('fs')
  , peg = require('pegjs')
  , jsonpatch = require('fast-json-patch')
  , pointer = require('json-pointer')
  , md5 = require('spark-md5')
  , stringify = require('json-stable-stringify')
  , grammar = fs.readFileSync(__dirname + '/patch_parser.pegjs', 'utf8')
  , parser = peg.buildParser(grammar)

var patchTypes = {
    SYNC: 10
  , MULTIPLE: 11
  , CREATE_PERIOD_COLLECTION: 20
  , DELETE_PERIOD_COLLECTION: 30
  , EDIT_PERIOD_COLLECTION: 40
  , CREATE_PERIOD: 50
  , DELETE_PERIOD: 60
  , EDIT_PERIOD: 70
}

function transformSimplePatch(patch, opts) {
  var replaced = []
    , { before, after } = opts

  if (!after) {
    after = JSON.parse(JSON.stringify(before));
    after = jsonpatch.apply(after, patch);
  }

  after = after || JSON.parse(JSON.stringify(before));

  return patch.reduce(function (acc, patch) {
    var parsed = parsePatchPath(patch.path)
      , valuePath
      , isSimpleAddOrRemove

    if (!parsed) return acc;

    if (parsed.type === 'context' || !parsed.label) {
      acc.push(patch);
      return acc;
    }

    valuePath = '/periodCollections/';
    valuePath += parsed.type === 'period' ?
      (parsed.collection_id + '/definitions/' + parsed.id)
      : parsed.id;
    valuePath += '/' + parsed.label.split('/')[0];

    isSimpleAddOrRemove = (
        (patch.op === 'add' || patch.op === 'remove') &&
        patch.path.split('/').slice(-1)[0] === parsed.label)

    if (isSimpleAddOrRemove) {
      acc.push(patch);
    } else {
      if (replaced.indexOf(valuePath) === -1) {
        replaced.push(valuePath);
        acc.push({ op: 'remove', path: valuePath, fake: true });
        acc.push({ op: 'add', path: valuePath, value: pointer.get(after, valuePath) });
      }
    }

    return acc;
  }, []);
}

function makePatch(before, after) {
  var cmp = jsonpatch.compare(before, after);
  return transformSimplePatch(cmp, { before, after });
}

function parsePatchPath(diff) {
  var path = typeof diff === 'object' ? diff.path : diff
    , changedAttr

  if (path === '/id' || path === '/primaryTopicOf') return null;

  try {
    changedAttr = parser.parse(path);
  } catch (e) {
    throw new Error('could not parse ' + path);
  }

  return changedAttr;
}

function classifyPatch(patch) {
  var parsed = parsePatchPath(patch.path)
    , type

  if (!parsed) return [null, ''];

  if (parsed.type === 'periodCollection' || parsed.type === 'period') {
    if (!parsed.label) {
      if (patch.op === 'add') {
        if (parsed.type === 'periodCollection') {
          type = [
            patchTypes.CREATE_PERIOD_COLLECTION,
            `Created period collection ${parsed.id}.`
          ]
        } else {
          type = [
            patchTypes.CREATE_PERIOD,
            `Created period ${parsed.id} in collection ${parsed.collection_id}.`
          ]
        }
      } else {
        if (parsed.type === 'periodCollection') {
          type = [
            patchTypes.DELETE_PERIOD_COLLECTION,
            `Deleted period collection ${parsed.id}.`
          ]
        } else {
          type = [
            patchTypes.DELETE_PERIOD,
            `Deleted period ${parsed.id} in collection ${parsed.collection_id}.`
          ]
        }
      }
    } else {
      if (parsed.type === 'periodCollection') {
        type = [
          patchTypes.EDIT_PERIOD_COLLECTION,
          `Changed ${parsed.label} of period collection ${parsed.id}.`
        ]
      } else {
        type = [
          patchTypes.EDIT_PERIOD,
          `Changed ${parsed.label} of period ${parsed.id} in collection ${parsed.collection_id}.`
        ]
      }
    }
  }
  return type || [null, ''];
}

function getAffected(patches) {
  if (!Array.isArray(patches)) patches = [patches];
  return patches.reduce(function (acc, p) {
    var parsed = parsePatchPath(p.path);
    if (parsed && parsed.type === 'period') {
      acc.periods.push(parsed.id);
      acc.collections.push(parsed.collection_id);
    } else if (parsed && parsed.type === 'periodCollection') {
      acc.collections.push(parsed.id);
    }
    return acc;
  }, { periods: [], collections: [] });
}

function hashPatch(p) { return md5.hash(stringify(p)) }

function formatPatch(oldData, newData, message) {
  var forward = makePatch(oldData, newData)
    , backward = makePatch(newData, oldData)
    , affected = getAffected(forward)
    , description
    , patch

  description = forward
    .filter(patch => !patch.fake)
    .map(patch => classifyPatch(patch)[1])
    .join('\n');

  message = message ? (message + '\n' + description) : description;

  patch = {
    forward: forward,
    forwardHashes: forward.map(hashPatch),
    backward: backward,
    backwardHashes: backward.map(hashPatch),
    created: new Date().getTime(),
    message: message,
    affectedCollections: affected.collections,
    affectedPeriods: affected.periods
  }

  // FIXME is patch.type really necessary?
  // patch.type = classifyPatchSet(patch);

  return patch;
}

const PERIOD_COLLECTION_REGEX = /^\/periodCollections/
function affectsPeriodCollections(patch) {
  return patch.path.match(PERIOD_COLLECTION_REGEX)
}

module.exports = {
  makePatch,
  formatPatch,
  hashPatch,
  transformSimplePatch,
  parsePatchPath,
  classifyPatch,
  getAffected,
  affectsPeriodCollections,
  patchTypes
}
