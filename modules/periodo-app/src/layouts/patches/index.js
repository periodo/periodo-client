"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , LayoutRenderer = require('../LayoutRenderer')
    , ListBlock = require('../ListBlock')
    , { Route, Navigable } = require('org-shell')
    , { Link, Text } = require('periodo-ui')

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
  itemViewRoute(item, { backend }) {
    return makeItemRoute(item, backend)
  },

  defaultOpts: {
    sortBy: 'merged',
    sortDirection: 'desc',
  },

  columns: {

    comment: {
      label: 'Comment',
      getValue: x => (
        x.firstComment || h('span', { style: { fontStyle: 'italic' }}, 'none')
      ),
    },

    creator: {
      width: '10em',
      label: 'Creator',
      getValue: x => x.submittedBy || {},
      render: ({ url, label }) => url
        ? h(Link, { href: url }, label)
        : h('span', label || '(undefined)'),
    },

    periods: {
      width: '6em',
      label: 'Affected periods',
      getValue: x => x.affectedItems.periods.length,
      render(value) {
        return h(Text, {
          width: '4ch',
          textAlign: 'right',
        }, value)
      },
    },

    authorities: {
      width: '6em',
      label: 'Affected authorities',
      getValue: x => x.affectedItems.authorities.length,
      render(value) {
        return h(Text, {
          width: '3ch',
          textAlign: 'right',
        }, value)
      },
    },

    merged: {
      width: '7em',
      label: 'Merged at',
      getValue: x => new Date(x.mergeTime).toLocaleString(),
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
