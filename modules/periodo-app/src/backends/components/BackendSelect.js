"use strict";

const h = require('react-hyperscript')
    , { Link } = require('periodo-ui')
    , { Box } = require('periodo-ui')
    , { Route } = require('org-shell')

const Table = Box.withComponent('table').extend`
  width: 100%;
  border-spacing: 4px 0;

  & tbody td {
    padding: 4px 0;
  }

  & th {
    font-weight: bold;
  }
`

module.exports = props =>
  h(Table, [
    h('thead', [
      h('tr', [
        h('th', 'Type'),
        h('th', 'Label'),
        h('th', 'Description'),
        h('th', 'Last opened'),
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
        h('td', {}, new Date(backend.metadata.accessed).toLocaleDateString()),
      ])
    ))
  ])
