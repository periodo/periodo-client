"use strict";

const h = require('react-hyperscript')
    , { LayoutEngine, ListBlock } = require('org-layouts')
    , fromArray = require('from2-array')

const PatchList = ListBlock({
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
    blocks: {
      'patch-list': PatchList,
    },
    createReadStream: () => fromArray.obj(patches),
    extraProps: {},
    spec,
    onSpecChange,
  }))
