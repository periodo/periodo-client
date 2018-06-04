"use strict";

const jsonpatch = require('fast-json-patch')
    , pointer = require('json-pointer')
    , md5 = require('spark-md5')
    , stringify = require('json-stable-stringify')
    , { PatchType } = require('./types')


/* Generate a JSON Patch to transform
 *
 * There are an infinite number of JSON patches that could patch one object
 * into another. `jsonpatch.compare()` generates the deepest possible
 * differences. This algorithm generates patches at (potentially) shallower
 * levels in order to make patches that are more semantically useful for
 * tracking changes to periods and authorities.
 */
function makePatch(before, after) {
  return jsonpatch.compare(before, after)
    .reduce(({ patches=[], replaced=[] }, patch) => {
      const { path, op } = patch
          , { authorityID, periodID, attribute } = PatchType.fromPatch(patch)

      const isSimpleAttributeChange = (
        (op === 'add' || op === 'remove') &&
        path.endsWith(`/${attribute}`)
      )

      if (!attribute || isSimpleAttributeChange) {
        return { patches: patches.concat(patch), replaced }
      }

      const attributePointer = pointer.compile(
        periodID
          ? ['authorities', authorityID, 'periods', periodID, attribute]
          : ['authorities', authorityID, attribute]
      )

      return replaced.includes(attributePointer)
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

function getAffected(patches) {
  return [].concat(patches).reduce(({ periods, authorities }, patch) => {
    const { authorityID, periodID } = PatchType.fromPatch(patch)

    return {
      periods: periods.concat(periodID || []),
      authorities: authorities.concat(authorityID || [])
    }
  }, { authorities: [], periods: [] })
}


function hashPatch(p) { return md5.hash(stringify(p)) }


function formatPatch(oldData, newData, message) {
  const forward = makePatch(oldData, newData)
    , backward = makePatch(newData, oldData)
    , affected = getAffected(forward)

  const description = forward
    .map(patch => PatchType.fromPatch(patch).getLabel())
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
    affectedAuthorities: affected.authorities,
    affectedPeriods: affected.periods
  }
}

module.exports = {
  makePatch,
  formatPatch,
  hashPatch,
  getAffected,
}
