"use strict";

const h = require('react-hyperscript')
    , { LayoutEngine, ListBlock } = require('org-layouts')
    , fromArray = require('from2-array')
    , { Link } = require('periodo-ui')

const PatchList = ListBlock({
  label: 'Patch list',
  description: 'List of patches',
  columns: {
    creator: {
      label: 'Creator',
      getValue: x => x.author,
      render: ({ url, label }) => url
        ? h(Link, { href: url }, label)
        : h('span', label)
    },

    created: {
      label: 'Created',
      getValue: x => new Date(x.time).toLocaleString(),
    },
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
