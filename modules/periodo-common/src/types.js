"use strict"

const Type = require('union-type')

exports.Result = Type({
  Ok: [ () => true ],
  Err: [ () => true ],
})

exports.stripUnionTypeFields = function stripUnionTypeFields(obj, shallow=true) {
  if (shallow) {
    delete obj._keys;
    delete obj._name;

    return obj
  }

  return JSON.parse(JSON.stringify(obj), (key, val) => {
    if (val && typeof val === 'object') {
      delete val._keys;
      delete val._name;
    }

    return val
  })
}
