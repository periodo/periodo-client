"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , Type = require('union-type')
    , { LayoutRenderer, blocks } = require('org-layouts')
    , { LocationStreamAware, Route } = require('org-shell')
    , { Link } = require('periodo-ui')

const PatchStatus = Type({
  Open: {},
  Rejected: {},
  Merged: {},
})

function Status({ status }) {
  const type = PatchStatus[status]

  const backgroundColor = type.case({
    Open: () => '#fafad2',
    Rejected: () => '#ff9a9a',
    Merged: () => '#8fbd8f',
  })

  return (
    h('span', {
      style: {
        textAlign: 'center',
        width: '95%',
        display: 'inline-block',
        padding: '4px 4px 5px',
        backgroundColor,
        fontWeight: 'bold',
      },
    }, status)
  )
}

const PatchRequestList = blocks.List({
  label: 'Patch request list',
  description: 'List of patch requests',
  navigateToItem(item, { locationStream, backend }) {
    const route = Route('review-patch', {
      backendID: backend.asIdentifier(),
      patchURL: item.url.replace(backend.storage.url, ''),
    })

    locationStream.write({ route })
  },

  defaultOpts: {
    sortBy: 'submitted',
    sortDirection: 'desc',
  },

  columns: {
    status: {
      label: 'Status',
      width: 100,
      getValue: req => {
        if (req.open) return 'Open'
        if (req.merged) return 'Merged'
        return 'Rejected'
      },
      render: status => h(Status, { status }),
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

module.exports = LocationStreamAware(props =>
  h(LayoutRenderer, R.omit(['patchRequests', 'backend', 'locationStream'], Object.assign({}, props, {
    blocks: {
      'request-list': PatchRequestList,
    },
    data: props.patchRequests,
    extraProps: {
      backend: props.backend,
      locationStream: props.locationStream,
    },
  }))))
