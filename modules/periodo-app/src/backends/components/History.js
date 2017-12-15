"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('axs-ui')
    , PatchLayoutRenderer = require('../../layouts/patches')

const layout = `
[]
type = patch-list
`

class PatchHistory extends React.Component {
  constructor() {
    super();

    this.state = { blockOpts: {} }
  }

  render() {
    const { patches } = this.props

    return (
      h(Box, [
        h(PatchLayoutRenderer, {
          patches,
          layout,
          blockOpts: this.state.blockOpts,
          onBlockOptsChange: blockOpts => this.setState({ blockOpts }),
        }),
        // h('pre', JSON.stringify(patches, true, '  ')),
      ])
    )
  }
}

module.exports = PatchHistory
