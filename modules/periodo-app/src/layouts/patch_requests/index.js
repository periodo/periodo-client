"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , LayoutRenderer = require('../LayoutRenderer')
    , ListBlock = require('../ListBlock')
    , { Navigable, Route } = require('org-shell')
    , { Link, Status } = require('periodo-ui')

const PatchRequestList = ListBlock({
  label: 'Patch request list',
  description: 'List of patch requests',
  itemViewRoute(item, { backend }) {
    return Route('review-patch', {
      backendID: backend.asIdentifier(),
      patchURL: item.url.replace(backend.storage.url, ''),
    })
  },

  defaultOpts: {
    sortBy: 'submitted',
    sortDirection: 'desc',
  },

  columns: {
    status: {
      label: 'Status',
      width: 100,
      getValue: req => req,
      render: req => h(Status, req),
    },

    creator: {
      label: 'Creator',
      getSortValue: x => x.label,
      getValue: x => x.created_by,
      render: x =>
        !x.label ? x.url : (
          h(Link, {
            href: x.url,
          }, x.label)
        ),
    },

    submitted: {
      label: 'Submitted',
      getValue: x => new Date(x.created_at).toLocaleString(),
    },
  },
})

module.exports = Navigable(props =>
  h(LayoutRenderer, R.omit([ 'patchRequests', 'backend', 'navigateTo' ], {
    ...props,
    blocks: {
      'request-list': PatchRequestList,
    },
    data: props.patchRequests,
    extraProps: {
      backend: props.backend,
      navigateTo: props.navigateTo,
    },
  })))
