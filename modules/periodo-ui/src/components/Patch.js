"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { applyPatch } = require('fast-json-patch')
    , { Dataset } = require('./Dataset')

const apply = (patch, data) => applyPatch(
  R.clone(data), R.clone(patch)
).newDocument

exports.Patch = function (props) {
  const { patch, data, ...rest } = props

  return (
    h(Dataset, {
      ...rest,
      value: data,
      compare: apply(patch, data),
    })
  )
}
