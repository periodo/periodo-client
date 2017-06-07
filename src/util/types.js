"use strict"

const Type = require('union-type')

exports.Result = Type({
  Ok: [() => true],
  Err: [() => true],
})
