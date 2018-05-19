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
      patchID: 'id' in item
        ? item.id.toString()
        : item.url
    })
  },
  columns: {
    creator: {
      label: 'Creator',
      getValue: x => x.submittedBy || {},
      render: ({ url, label }) => url
        ? h(Link, { href: url }, label)
        : h('span', label || '(undefined)')
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
