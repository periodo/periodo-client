"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { LayoutRenderer, blocks } = require('org-layouts')
    , { Route, LocationStreamAware } = require('org-shell')
    , { Link } = require('periodo-ui')

function makeItemRoute(item, backend) {
  return Route('backend-patch', {
    backendID: backend.asIdentifier(),
    patchID: 'id' in item
      ? item.id.toString()
      : item.url,
  })
}

const PatchList = blocks.List({
  label: 'Patch list',
  description: 'List of patches',
  navigateToItem(item, { locationStream, backend }) {
    locationStream.write({
      route: makeItemRoute(item, backend),
    })
  },

  defaultOpts: {
    sortBy: 'merged',
    sortDirection: 'desc',
  },

  columns: {
    creator: {
      label: 'Creator',
      getValue: x => x.submittedBy || {},
      render: ({ url, label }) => url
        ? h(Link, { href: url }, label)
        : h('span', label || '(undefined)'),
    },

    merged: {
      label: 'Merged at',
      getValue: x => new Date(x.mergeTime).toLocaleString(),
    },

    comment: {
      label: 'Comment',
      getValue: x => x.firstComment,
    },
  },
})

module.exports = LocationStreamAware(props =>
  h(LayoutRenderer, R.omit([ 'patches', 'backend', 'locationStream' ], {
    ...props,
    blocks: {
      'patch-list': PatchList,
    },
    data: props.patches,
    extraProps: {
      backend: props.backend,
      locationStream: props.locationStream,
    },
  })))
