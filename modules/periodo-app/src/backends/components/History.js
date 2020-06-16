"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box, HelpText } = require('periodo-ui')
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
