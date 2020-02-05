"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , LayoutRenderer = require('../LayoutRenderer')
    , ListBlock = require('../ListBlock')
    , { Route, Navigable } = require('org-shell')
    , { Link } = require('periodo-ui')

function makeItemRoute(item, backend) {
  return Route('backend-patch', {
    backendID: backend.asIdentifier(),
    patchID: 'id' in item
      ? item.id.toString()
      : item.url,
  })
}

const PatchList = ListBlock({
  label: 'Patch list',
  description: 'List of patches',
  navigateToItem(item, { navigateTo, backend }) {
    navigateTo(makeItemRoute(item, backend))
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

    periods: {
      label: 'Affected periods',
      getValue: x => x.affectedItems.periods.length,
    },

    authorities: {
      label: 'Affected authorities',
      getValue: x => x.affectedItems.authorities.length,
    },

    comment: {
      label: 'Comment',
      getValue: x => x.firstComment,
    },
  },
})

module.exports = Navigable(props =>
  h(LayoutRenderer, R.omit([ 'patches', 'backend', 'navigateTo' ], {
    ...props,
    blocks: {
      'patch-list': PatchList,
    },
    data: props.patches,
    extraProps: {
      backend: props.backend,
      navigateTo: props.navigateTo,
    },
  })))
