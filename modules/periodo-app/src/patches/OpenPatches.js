"use strict";

const h = require('react-hyperscript')
    , { Box, Text, Link } = require('periodo-ui')
    , { Route } = require('org-shell')

function ReviewPatches(props) {
  const { patchRequests } = props

  return (
    h(Box, [
      h(Text, `${patchRequests.length} open patch requests`),
      h('ul', patchRequests.map(req =>
        h(Box, { is: 'li', mb: 2, key: req.url }, [
          h('div', [
            h(Link, {
              route: Route('review-patch', {
                patchURL: encodeURIComponent(req.url.replace(window.location.origin, '')),
              })
            }, [
              'Patch ',
              req.url.slice(0, -1).split('/').pop()
            ])
          ]),

          h('div', [
            'Created by ' + req.created_by.label + ' at ' + new Date(req.created_at),
          ]),
        ])
      ))
    ])
  )
}

module.exports = ReviewPatches;
