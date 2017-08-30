"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { LayoutEngine, makeListLayout } = require('org-layout-engine')
    , fromArray = require('from2-array')

const PatchList = makeListLayout({
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
