"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box } = require('axs-ui')
    , { Link, Breadcrumb, DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } = require('lib/ui')
    , { RouterKnower } = require('lib/util/hoc')
    , AuthorityLayout = require('../../layouts/authorities')

module.exports = RouterKnower(class BackendHome extends React.Component {
  constructor() {
    super();

    this.state = {
      spec: {
        groups: [
          {
            layouts: [
              { name: 'authorityList' },
            ]
          }
        ]
      }
    }

    this.updateLayoutOpts = this.updateLayoutOpts.bind(this);
  }

  updateLayoutOpts(i, j, fn) {
    this.setState(prev => {
      const spec = R.over(R.lensPath(['groups', i, 'layouts', j, 'opts']), fn, prev.spec)

      return { spec }
    })
  }

  render() {
    const { backend, generateRoute } = this.props

    return (
      h(Box, [
        h(Box, [
          /*
          h(DropdownMenu, {
            label: 'Layout',
            ml: 2,
            onSelection: val => {
              if (val === 'reset') {
                this.setState({ spec: { groups: [] }});
              }
              // TODO
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
          */
        ]),

        h(AuthorityLayout, {
          backend,
          spec: this.state.spec,
          updateLayoutOpts: this.updateLayoutOpts.bind(this)
        }),
      ])
    )
  }
})
