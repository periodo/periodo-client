"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Flex, Box, Heading } = require('periodo-ui')
    , { Authority } = require('periodo-ui')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')
    , DatasetProxy = require('../dataset_proxy')

const layout = `
[]
type = period-list
`

class AuthorityLayout extends React.Component {
  constructor() {
    super()
    this.state = { blockOpts: {} }
  }

  render() {
    const { backend, authority } = this.props

    return (
      h(AuthorityLayoutRenderer, {
        layout,
        backend,
        dataset: new DatasetProxy({
          authorities: {
            [authority.id]: authority,
          },
        }),
        blockOpts: this.state.blockOpts,
        onBlockOptsChange: blockOpts => this.setState({ blockOpts }),
      })
    )
  }
}

module.exports = ({ backend, authority }) =>
  h(Flex, [
    h(Box, { width: .5 }, [
      h(Heading, { level: 2 }, 'Authority'),

      h(Authority, { value: authority }),
    ]),

    h(Box, { width: .5 }, [
      h(Heading, { level: 2 }, 'Periods'),

      h(AuthorityLayout, { backend, authority }),
    ]),
  ])
