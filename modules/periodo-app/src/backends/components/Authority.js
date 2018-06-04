"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Flex, Box, Heading } = require('periodo-ui')
    , { Source } = require('periodo-ui')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')

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
        dataset: {
          authorities: {
            [authority.id]: authority
          }
        },
        blockOpts: this.state.blockOpts,
        onBlockOptsChange: blockOpts => this.setState({ blockOpts })
      })
    )
  }
}

module.exports = ({ backend, authority }) =>
  h(Flex, [
    h(Box, { width: .5 }, [
      h(Heading, { level: 2 }, 'Source'),

      h(Source, { value: authority.source }),
    ]),

    h(Box, { width: .5 }, [
      h(Heading, { level: 2 }, 'Periods'),

      h(AuthorityLayout, { backend, authority })
    ]),
  ])
