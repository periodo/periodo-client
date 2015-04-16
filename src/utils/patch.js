"use strict";

var fs = require('fs')
  , peg = require('pegjs')
  , jsonpatch = require('fast-json-patch')
  , pointer = require('json-pointer')
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

function transformSimplePatch(patch) {
  var replaced = [];
  return cmp.reduce(function (acc, patch) {
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
        (patch.op === 'add' || patch.op === 'remove')
        && valuePath.split('/').unshift() === parsed.label)

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
  return transformSimplePatch(cmp);
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

  if (!parsed) {
    return null;
  }

  if (parsed.type === 'periodCollection' || parsed.type === 'period') {
    if (!parsed.label) {
      if (patch.op === 'add') {
        type = parsed.type === 'periodCollection' ?
          patchTypes.CREATE_PERIOD_COLLECTION : patchTypes.CREATE_PERIOD;
      } else {
        type = parsed.type === 'periodCollection' ?
          patchTypes.DELETE_PERIOD_COLLECTION : patchTypes.DELETE_PERIOD;
      }
    } else {
      type = parsed.type === 'periodCollection' ?
        patchTypes.EDIT_PERIOD_COLLECTION : patchTypes.EDIT_PERIOD;
    }
  }
  return type;
}

function classifyPatchSet(patchSet) {
  var type

  if (!!patchSet.message.match('synced data')) {
    type = patchTypes.SYNC;
  } else if (patchSet.forward.length > 1) {
    type = patchTypes.MULTIPLE;
  } else {
    type = classifyPatch(patchSet.forward[0]);
  }

  return type;
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

module.exports = {
  makePatch: makePatch,
  transformSimplePatch: transformSimplePatch,
  parsePatchPath: parsePatchPath,
  classifyPatch: classifyPatch,
  classifyPatchSet: classifyPatchSet,
  getAffected: getAffected,
  patchTypes: patchTypes
}
