"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('axs-ui')
    , { Link, Breadcrumb, DropdownMenu, DropdownMenuItem } = require('lib/ui')
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
      h('div', [
        h(Breadcrumb, [
          h(Link, { href: '#open-backend' }, 'Backends'),
          backend.metadata.label,
        ]),


        backend.isEditable && h(Box, { mb: 2 }, [
          h(DropdownMenu, {
            label: 'Backend',
            onSelection: val => {
              // TODO
            }
          }, [
            h(DropdownMenuItem, {
              css: {
                minWidth: '200px',
              },
              value: generateRoute('backend-new-authority', { backendID: 'local-' + backend.type.id }),
            }, 'Add authority'),

            h(DropdownMenuItem, {
              value: generateRoute('backend-history', { backendID: 'local-' + backend.type.id }),
            }, 'History'),
          ]),

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
          ]),
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
