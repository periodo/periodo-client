"use strict";

const fs = require('fs')
    , peg = require('pegjs')
    , jsonpatch = require('fast-json-patch')
    , pointer = require('json-pointer')
    , md5 = require('spark-md5')
    , stringify = require('json-stable-stringify')
    , grammar = fs.readFileSync(__dirname + '/patch_parser.pegjs', 'utf8')
    , parser = peg.buildParser(grammar)
    , { patchTypes } = require('../types')


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
          , { collectionID, periodID, attribute } = describePatch(patch)

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


function describePatch({ path, op }) {
  // FIXME Ignore if top-level change

  let parsed;
  try {
    parsed = parser.parse(path);
  } catch (e) {
    throw new Error('could not parse ' + path);
  }

  const { collectionID, periodID, attribute } = parsed
      , opLabel = !attribute ? op.toUpperCase() : 'CHANGE'
      , target = periodID ? 'PERIOD' : 'PERIOD_COLLECTION'
      , type = patchTypes[`${opLabel}_${target}`]

  // TODO Move this stuff to general i18n
  let label

  if (!attribute) {
    const verb = op === 'add' ? 'Created' : 'Deleted'

    if (periodID) {
      label = `${verb} period ${periodID} in collection ${collectionID}.`
    } else {
      label = `${verb} period collection ${collectionID}.`
    }
  } else {
    if (periodID) {
      label = `Changed ${attribute} of period ${periodID} in collection ${collectionID}.`
    } else {
      label = `Changed ${attribute} of period collection ${collectionID}.`
    }
  }

  return { type, label, collectionID, periodID, attribute }
}


function getAffected(patches) {
  return [].concat(patches).reduce(({ periods, collections }, patch) => {
    const { collectionID, periodID } = describePatch(patch)

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
    .map(patch => describePatch(patch).label)
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

module.exports = {
  makePatch,
  formatPatch,
  hashPatch,
  describePatch,
  getAffected,
}
