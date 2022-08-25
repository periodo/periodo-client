"use strict";

const h = require('react-hyperscript')
    , LayoutRenderer = require('../LayoutRenderer')
    , ListBlock = require('../ListBlock')
    , { Navigable, Route } = require('org-shell')
    , { Link, Status, Text } = require('periodo-ui')
    , { patchNumber } = require('periodo-utils')

const PatchRequestList = ListBlock({
  label: 'Patch request list',
  description: 'List of patch requests',
  emptyMessage: 'No open submissions',
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
    number: {
      label: '#',
      width: '5ch',
      getValue: req => req,
      render: req => h(Text, { fontWeight: 'bold' }, patchNumber(req.url)),
    },

    status: {
      label: '     Status',
      width: 100,
      getValue: req => req,
      render: req => h(Status, req),
    },

    comment: {
      label: 'Comment',
      getValue: x => (
        x.first_comment || h('span', { style: { fontStyle: 'italic' }}, 'none')
      ),
    },

    creator: {
      width: '10em',
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

    creator_email: {
      width: '17em',
      label: 'Email',
      getSortValue: x => x.mbox,
      getValue: x => x.created_by,
      render: x =>
        !x.mbox ? h('span', { style: { fontStyle: 'italic' }}, 'unlisted') : (
          h(Link, {
            href: x.mbox,
          }, x.mbox.slice(7))
        ),
    },

    submitted: {
      width: '7em',
      label: 'Submitted',
      getValue: x => new Date(x.created_at).toLocaleString(),
    },
  },
})

module.exports = Navigable(
  ({
    patchRequests,
    backend,
    navigateTo,
    ...props
  }) => (
    h(LayoutRenderer, {
      ...props,
      blocks: { 'request-list': PatchRequestList },
      data: patchRequests,
      extraProps: {
        backend,
        navigateTo,
      },
    })
  )
)
