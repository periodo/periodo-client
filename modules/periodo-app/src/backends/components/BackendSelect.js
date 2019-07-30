"use strict";

const h = require('react-hyperscript')
    , { Box, ResourceTitle, Link, Text } = require('periodo-ui')
    , { Route } = require('org-shell')
    , { themeGet } = require('styled-system')
    , AddBackend = require('./AddBackend')

const Table = Box.withComponent('table').extend`
  width: 100%;
  border-spacing: 4px 0;
  border-collapse: collapse;

  border: 1px solid ${themeGet('colors.gray.1')};

  & td, & th {
    padding: 6px;
    border-bottom: 1px solid ${themeGet('colors.gray.1')};
  }

  & th {
    background-color: ${themeGet('colors.gray.1')};
    text-align: left;
    font-weight: bold;
  }
`

module.exports = props =>
  h(Box, [
    h(ResourceTitle, 'Select backend'),
    h(Table, {}, [
      h('thead', [
        h('tr', [
          h('th', 'Type'),
          h('th', 'Label'),
          h('th', 'Description'),
          h('th', 'Last opened'),
        ]),
      ]),

      h('tbody', {}, props.backends.length
        ? props.backends.map(backend =>
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
                  }),
                }, backend.metadata.label),
              ]),
              h('td', backend.metadata.description),
              h('td', {}, new Date(backend.metadata.accessed).toLocaleDateString()),
            ])
        )
      : h('tr', [
          h('td', { colspan: 4 }, [
            h(Text, {
              py: 2,
              fontSize: 2,
              color: 'gray.7',
            }, 'No backends currently defined. Add one below.'),
          ]),
        ])
      ),
    ]),

    h(AddBackend, Object.assign({}, props, {
      onSave: () => {
        window.location.reload();
      },
    })),
  ])
