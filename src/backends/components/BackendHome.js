"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Text } = require('axs-ui')
    , { DropdownMenu, DropdownMenuItem } = require('lib/ui')
    , AuthorityLayout = require('../../layouts/authorities')

const specLength = R.path(['opts', 'spec', 'length'])

module.exports = class BackendHome extends React.Component {
  constructor() {
    super();

    this.state = { addAt: null }
  }

  componentDidUpdate(prevProps) {
    if (specLength(prevProps) !== specLength(this.props)) {
      this.setState({ addAt: null })
    }
  }

  render() {
    const { backend, dataset, updateOpts } = this.props
        , { spec=[] } = this.props.opts
        , { addAt } = this.state

    return (
      h(Box, [
        h(Flex, {
          justifyContent: 'space-around',
          pb: 2,
        }, [
          h(Text, { mx: 1 }, [
            'Created: ' + new Date(backend.metadata.created).toLocaleString(),
          ]),

          h(Text, { mx: 1 }, [
            'Last modified: ' + new Date(backend.metadata.modified).toLocaleString(),
          ]),

          h(Text, { mx: 1 }, [
            'Last accessed: ' + new Date(backend.metadata.accessed).toLocaleString(),
          ]),

        ]),

        h(Box, [
          h(DropdownMenu, {
            label: 'Layout',
            ml: 2,
            onSelection: val => {
              if (val === 'add group') {
                this.setState({ addAt: Infinity })
              }

              if (val === 'reset') {
                updateOpts(() => ({}));
              }
            }
          }, [
            h(DropdownMenuItem, {
              value: 'add group'
            }, 'Add group'),

            h(DropdownMenuItem, {
              value: 'reset',
            }, 'Reset'),

            h(DropdownMenuItem, {
              value: 'save',
            }, 'Save'),
          ]),
        ]),

        h(AuthorityLayout, {
          spec,
          backend,
          dataset,
          addAt,
          onSpecChange: spec =>
            updateOpts(R.set(R.lensProp('spec'), spec))
        }),
      ])
    )
  }
}
