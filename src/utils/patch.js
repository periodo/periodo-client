"use strict";

const fs = require('fs')
    , peg = require('pegjs')
    , jsonpatch = require('fast-json-patch')
    , pointer = require('json-pointer')
    , md5 = require('spark-md5')
    , stringify = require('json-stable-stringify')
    , grammar = fs.readFileSync(__dirname + '/patch_parser.pegjs', 'utf8')
    , parser = peg.buildParser(grammar)

const { patchTypes } = require('../types')


/* Generate a JSON Patch to transform
 *
 * There are an infinite number of JSON patches that could patch one object
 * into another. `jsonpatch.compare()` generates the deepest possible
 * differences. This algorithm generates patches at (potentially) shallower
 * levels in order to make patches that are more semantically useful for
 * tracking changes to periods and period collections.
 */
function makePatch(before, after) {
  return jsonpatch.compare(before, after)
    .reduce(({ patches=[], replaced=[] }, patch) => {
      const { path, op } = patch
          , parsed = parsePatchPath(path)

      if (!parsed) {
        return { patches, replaced }
      }

      const { collectionID, periodID, attribute } = parsed

      const isSimpleAttributeChange = (
        (op === 'add' || op === 'remove') &&
        path.split('/').slice(-1)[0] === attribute
      );

      if (!attribute || isSimpleAttributeChange) {
        return { patches: patches.concat(patch), replaced }
      }

      const attributePointer = pointer.compile(
        periodID
          ? ['periodCollections', collectionID, 'definitions', periodID, attribute]
          : ['periodCollections', collectionID, attribute]
      )

      return replaced.indexOf(attributePointer) !== -1
        ? { patches, replaced }
        : {
          patches: patches.concat({
            op: 'add',
            path: attributePointer,
            value: pointer.get(after, attributePointer)
          }),
          replaced: replaced.concat(attributePointer)
        }
    }, { patches: [], replaced: [] })
    .patches
}

function parsePatchPath(diff) {
  const path = typeof diff === 'object' ? diff.path : diff

  let changedAttr

  if (path === '/id' || path === '/primaryTopicOf') return null;

  try {
    changedAttr = parser.parse(path);
  } catch (e) {
    throw new Error('could not parse ' + path);
  }

  return changedAttr;
}

function classifyPatch({ op, path }) {
  const parsed = parsePatchPath(path)
      , { collectionID, periodID, attribute } = parsed || {}

  if (!collectionID) return [null, ''];

  if (!attribute) {
    const verb = op === 'add' ? 'Created' : 'Deleted'

    if (periodID) {
      return [
        op === 'add' ? patchTypes.CREATE_PERIOD : patchTypes.DELETE_PERIOD,
        `${verb} period ${periodID} in collection ${collectionID}.`
      ]
    } else {
      return [
        op === 'add' ? patchTypes.CREATE_PERIOD_COLLECTION : patchTypes.DELETE_PERIOD_COLLECTION,
        `${verb} period collection ${collectionID}.`
      ]
    }
  } else {
    if (periodID) {
      return [
        patchTypes.EDIT_PERIOD,
        `Changed ${attribute} of period ${periodID} in collection ${collectionID}.`
      ]
    } else {
      return [
        patchTypes.EDIT_PERIOD_COLLECTION,
        `Changed ${attribute} of period collection ${collectionID}.`
      ]
    }
  }
}

function getAffected(patches) {
  return [].concat(patches).reduce(({ periods, collections }, { path }) => {
    const { collectionID, periodID } = parsePatchPath(path) || {}

    return {
      periods: periods.concat(periodID || []),
      collections: collections.concat(collectionID || [])
    }
  }, { collections: [], periods: [] })
}

function hashPatch(p) { return md5.hash(stringify(p)) }

function formatPatch(oldData, newData, message) {
  const forward = makePatch(oldData, newData)
    , backward = makePatch(newData, oldData)
    , affected = getAffected(forward)

  const description = forward
    .map(patch => classifyPatch(patch)[1])
    .join('\n');

  message = message
    ? (message + '\n' + description)
    : description

  return {
    forward,
    backward,
    message,
    forwardHashes: forward.map(hashPatch),
    backwardHashes: backward.map(hashPatch),
    created: new Date().getTime(),
    affectedCollections: affected.collections,
    affectedPeriods: affected.periods
  }
}

const PERIOD_COLLECTION_REGEX = /^\/periodCollections/
function affectsPeriodCollections(patch) {
  return patch.path.match(PERIOD_COLLECTION_REGEX)
}

module.exports = {
  makePatch,
  formatPatch,
  hashPatch,
  parsePatchPath,
  classifyPatch,
  getAffected,
  affectsPeriodCollections,
  patchTypes
}
