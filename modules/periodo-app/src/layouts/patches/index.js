"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , LayoutEngine = require('org-layout-engine/Engine')
    , makeList = require('org-layout-engine/List')
    , fromArray = require('from2-array')

const PatchList = makeList({
  label: 'Patch list',
  description: 'List of patches',
  columns: {
    created: {
      label: 'Created',
      getValue: x => x.created,
    },

    creator: {
      label: 'Creator',
      getValue: x => x.creator,
    }
  },
})

module.exports = ({ spec, onSpecChange, patches }) =>
  h(LayoutEngine, Object.assign({
    layouts: {
      'patch-list': PatchList,
    },
    createReadStream: () => fromArray.obj(patches),
    extraProps: {},
    spec,
    onSpecChange,
  }))
