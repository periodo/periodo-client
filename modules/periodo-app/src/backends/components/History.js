"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Route } = require('org-shell')
    , { Box, Breadcrumb, Link, HelpText } = require('periodo-ui')
    , util = require('periodo-utils')
    , PatchLayoutRenderer = require('../../layouts/patches')

const layout = `
[]
type = patch-list
`

class PatchHistory extends React.Component {
  constructor() {
    super();

    this.state = { blockOpts: {}}
  }

  render() {
    const { patches, backend, authority, period } = this.props

    return (
      h(Box, [

        h(Breadcrumb, {
          truncate: [ 1 ],
        }, [
          h(Link, {
            route: Route('backend-home', {
              backendID: backend.asIdentifier(),
            }),
          }, backend.metadata.label),
          ...(
            authority
              ? [
                h(Link, {
                  route: Route('authority-view', {
                    backendID: backend.asIdentifier(),
                    authorityID: authority.id,
                  }),
                }, util.authority.displayTitle(authority)),
                ...(
                  period
                    ? [
                      h(Link, {
                        route: Route('period-view', {
                          backendID: backend.asIdentifier(),
                          authorityID: authority.id,
                          periodID: period.id,
                        }),
                      }, period.label),
                    ]
                    : []
                ),
              ]
              : []
          ),
          'History',
        ]),

        patches.length === 0
          ? h(HelpText, `No history of changes to this ${
            authority
              ? period
                ? 'period'
                : 'authority'
              : 'data source'
          }.`)
          : (
            h(PatchLayoutRenderer, {
              backend,
              patches,
              layout,
              blockOpts: this.state.blockOpts,
              onBlockOptsChange: blockOpts => this.setState({ blockOpts }),
            })
          ),
      ])
    )
  }
}

module.exports = PatchHistory
