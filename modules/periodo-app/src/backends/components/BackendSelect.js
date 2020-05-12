"use strict";

const h = require('react-hyperscript')
    , { Box, Link, Text } = require('periodo-ui')
    , { SectionHeading, Section } = require('periodo-ui')
    , { Route, Navigable } = require('org-shell')
    , { themeGet } = require('styled-system')
    , AddBackend = require('./AddBackend')

const Table = Box.withComponent('table').extend`
  width: 100%;
  border-spacing: 4px 0;
  border-collapse: collapse;

  & td, & th {
    padding: 8px 16px;
  }

  & tr {
    background-color: ${themeGet('colors.gray.1')};
  }

  & tr:hover {
    background-color: white;
  }

  & th {
    background-color: ${themeGet('colors.gray.1')};
    text-align: left;
    font-weight: bold;
  }
`

module.exports = Navigable(props =>
  h(Box, [
    h(SectionHeading, 'Select data source'),
    h(Section, [
      h(Table, [
        h('thead', [
          h('tr', [
            h('th', 'Label'),
            h('th', 'Description'),
            h('th', 'Type'),
            h('th', 'Last opened'),
            h('th', ''),
          ]),
        ]),

        h('tbody', {}, props.backends.length
          ? props.backends.map(backend =>
            h('tr', { key: backend.storage.url || backend.storage.id }, [
              h('td', [
                h(Link, {
                  route: Route('backend-home', {
                    backendID: backend.asIdentifier(),
                  }),
                }, backend.metadata.label),
              ]),
              h('td', backend.metadata.description),
              h('td', backend.storage.case({
                Web: () => 'Web',
                IndexedDB: () => 'In-browser',
                Memory: () => 'Memory',
                Canonical: () => 'Web',
                StaticFile: () => 'File',
              })),
              h('td', {}, new Date(
                backend.metadata.accessed).toLocaleDateString()),
              h('td', { style: { textAlign: 'right' }}, [
                h(Link, {
                  fontWeight: 100,
                  route: Route('backend-edit', {
                    backendID: backend.asIdentifier(),
                  }),
                }, 'edit'),
              ]),
            ])
          )
          : h('tr', [
            h('td', { colspan: 4 }, [
              h(Text, {
                py: 2,
                fontSize: 2,
                color: 'gray.7',
              }, 'No data sources currently defined. Add one below.'),
            ]),
          ])
        ),
      ]),
    ]),

    h(AddBackend, {
      ...props,
      onSave: backend => {
        props.navigateTo(Route('backend-home', {
          backendID: backend.asIdentifier(),
        }))
      },
    }),
  ])
)
