"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Text } = require('axs-ui')
    , { DropdownMenu, DropdownMenuItem } = require('lib/ui')
    , AuthorityLayout = require('../../layouts/authorities')

module.exports = class BackendHome extends React.Component {
  render() {
    const { backend, dataset, updateOpts } = this.props
        , { spec={ groups: [] } } = this.props.opts

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
                updateOpts(
                  R.over(
                    R.lensPath(['spec', 'groups']),
                    R.append({
                      layouts: [],
                    })
                  )
                )
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

        h('pre', JSON.stringify(spec, true, '  ')),

        h(AuthorityLayout, {
          spec,
          backend,
          dataset,
          onSpecChange: spec =>
            updateOpts(R.set(R.lensProp('spec'), spec))
        }),
      ])
    )
  }
}
