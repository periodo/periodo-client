"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('periodo-ui')
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
    const { patches, backend } = this.props

    return (
      h(Box, [
        h(PatchLayoutRenderer, {
          backend,
          patches,
          layout,
          blockOpts: this.state.blockOpts,
          onBlockOptsChange: blockOpts => this.setState({ blockOpts }),
        }),
      ])
    )
  }
}

module.exports = PatchHistory
