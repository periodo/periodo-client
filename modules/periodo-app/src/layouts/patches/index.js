"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { LayoutRenderer, blocks } = require('org-layouts')
    , fromArray = require('from2-array')
    , { Link } = require('periodo-ui')

const PatchList = blocks.List({
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

module.exports = props =>
  h(LayoutRenderer, R.omit(['patches'], Object.assign({}, props, {
    blocks: {
      'patch-list': PatchList,
    },
    createReadStream: () => fromArray.obj(props.patches),
    extraProps: {},
  })))
