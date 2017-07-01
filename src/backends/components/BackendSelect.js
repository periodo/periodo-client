"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')
    , { Link } = require('lib/ui')
    , { Box } = require('axs-ui')
    , { Route } = require('lib/router')

module.exports = props =>
  h(Box, [
    h('table', [
      h('thead', [
        h('tr', [
          h('td', 'Type'),
          h('td', 'Label'),
          h('td', 'Description'),
          h('td', 'Last opened'),
        ])
      ]),

      h('tbody', props.backends.map(backend =>
        h('tr', { key: backend.storage.url || backend.storage.id }, [
          h('td', backend.storage.case({
            Web: () => 'Web',
            IndexedDB: () => 'Local',
            Memory: () => 'Memory',
          })),
          h('td', [
            h(Link, {
              href: Route('backend', {
                backendID: backend.asIdentifier(),
              })
            }, backend.metadata.label)
          ]),
          h('td', backend.metadata.description),
          h('td', {}, new Date(backend.metadata.accessed).toLocaleDateString()),
        ])
      ))
    ]),
  ])
