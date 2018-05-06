"use strict";

const h = require('react-hyperscript')
    , { Link } = require('periodo-ui')
    , { Box } = require('periodo-ui')
    , { Route } = require('org-shell')

module.exports = props =>
  h(Box, {
    is: 'table',
    css: {
      width: '100%',
      borderSpacing: '4px 0',
    }
  }, [
    h('thead', [
      h('tr', [
        h(Box, {
          is: 'td',
          css: {
            fontWeight: 'bold',
          },
        }, 'Type'),
        h(Box, {
          is: 'td',
          css: {
            fontWeight: 'bold',
          },
        }, 'Label'),
        h(Box, {
          is: 'td',
          css: {
            fontWeight: 'bold',
          },
        }, 'Description'),
        h(Box, {
          is: 'td',
          css: {
            fontWeight: 'bold',
          },
        }, 'Last opened'),
      ])
    ]),

    h('tbody', props.backends.map(backend =>
      h('tr', { key: backend.storage.url || backend.storage.id }, [
        h('td', backend.storage.case({
          Web: () => 'Web',
          IndexedDB: () => 'Local',
          Memory: () => 'Memory',
          Canonical: () => 'Web',
        })),
        h('td', [
          h(Link, {
            route: Route('backend-home', {
              backendID: backend.asIdentifier(),
            })
          }, backend.metadata.label)
        ]),
        h('td', backend.metadata.description),
        h(Box, {
          is: 'td',
          padding: '4px 0',
        }, new Date(backend.metadata.accessed).toLocaleDateString()),
      ])
    ))
  ])
