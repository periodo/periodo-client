"use strict"

const Type = require('union-type')

exports.Result = Type({
  Ok: [ () => true ],
  Err: [ () => true ],
})

exports.stripUnionTypeFields = function stripUnionTypeFields(obj) {
  return JSON.parse(JSON.stringify(obj), (key, val) => {
    if (typeof val !== 'object') return val

    delete val._keys;
    delete val._name;

    return val
  })
}
