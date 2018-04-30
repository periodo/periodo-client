"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { LayoutRenderer, blocks } = require('org-layouts')
    , { Route } = require('org-shell')
    , fromArray = require('from2-array')
    , { Link } = require('periodo-ui')

const PatchList = blocks.List({
  label: 'Patch list',
  description: 'List of patches',
  makeItemRoute({ item, backend }) {
    return Route('backend-patch', {
      backendID: backend.asIdentifier(),
      patchID: item.id.toString(),
    })
  },
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
  h(LayoutRenderer, R.omit(['patches', 'backend'], Object.assign({}, props, {
    blocks: {
      'patch-list': PatchList,
    },
    createReadStream: () => fromArray.obj(props.patches),
    extraProps: { backend: props.backend },
  })))
