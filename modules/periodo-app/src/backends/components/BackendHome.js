"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Span, Text } = require('axs-ui')
    , { DropdownMenu, DropdownMenuItem } = require('periodo-ui')
    , AuthorityLayout = require('../../layouts/authorities')

const specLength = R.path(['opts', 'spec', 'layouts', 'length'])

module.exports = class BackendHome extends React.Component {
  constructor() {
    super();

    this.state = {
      addAt: null,
      editGrid: false,
    }
  }

  componentDidUpdate(prevProps) {
    if (specLength(prevProps) !== specLength(this.props)) {
      this.setState({ addAt: null })
    }
  }

  render() {
    const { backend, dataset, updateOpts } = this.props
        , { spec={ layouts: [{ name: 'list' }]} } = this.props.opts
        , { addAt, editGrid } = this.state

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
              switch (val) {
                case 'add group':
                  this.setState({ addAt: Infinity })
                  break;

                case 'reset':
                  updateOpts(() => ({ spec: { layouts: [] }}));
                  break;

                case 'edit-grid':
                  this.setState(prev => ({ editGrid: !prev.editGrid }))
                  break;

                default:
                  break;
              }
              if (val === 'add group') {
              }

              if (val === 'reset') {
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
              value: 'edit-grid',
            }, [
              'Edit grid',
              editGrid && h(Span, { css: { float: 'right' }}, '✔'),
            ]),

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
          editGrid,
          onSpecChange: spec =>
            updateOpts(R.set(R.lensProp('spec'), spec))
        }),
      ])
    )
  }
}