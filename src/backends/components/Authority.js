"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Flex, Box, Heading } = require('axs-ui')
    , { Source } = require('lib/ui')
    , AuthorityLayout = require('../../layouts/authorities')

function LayoutHaver(Component, defaultSpec={ layouts: [] }) {
  return class LayoutHaver extends React.Component {
    constructor() {
      super()

      this.state = {
        spec: defaultSpec
      }
    }

    render() {
      return h(Component, Object.assign({
        onSpecChange: spec => this.setState({ spec })
      }, this.props, this.state))
    }
  }
}

module.exports = LayoutHaver(({ backend, authority, spec, onSpecChange }) =>
  h(Flex, [
    h(Box, { width: .5 }, [
      h(Heading, { level: 2 }, 'Source'),

      h(Source, { source: authority.source }),
    ]),

    h(Box, { width: .5 }, [
      h(Heading, { level: 2 }, 'Periods'),

      h(AuthorityLayout, {
        backend,
        dataset: {
          periodCollections: {
            [authority.id]: authority
          }
        },
        spec,
        onSpecChange,
      }),
    ]),

  ]),
  { layouts: [{ name: 'list', opts: { limit: 25 } }] }
)
