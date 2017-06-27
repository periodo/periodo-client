"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('axs-ui')
    , { Source } = require('lib/ui')

module.exports = class Authority extends React.Component {
  constructor() {
    super();

    this.state = {
      addingPeriod: false,
      period: {},
    }
  }

  render() {
    const { backend, id } = this.props
        , authority = backend.dataset.periodCollections[id]

    return (
      h(Box, [
        h(Source, { source: authority.source }),
      ])
    )
  }
}
