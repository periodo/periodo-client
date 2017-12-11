"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Text } = require('axs-ui')
    , AuthorityLayout = require('../../layouts/authorities')

const defaultLayout = `
grid-gap = 1em 2.5em
grid-template-columns = 1fr 1fr

[HumanTime]
name = humans
grid-column = 2/3
grid-row = 1/2

[Search]
name = text
grid-column = 1/2
grid-row = 1/2

[PeriodList]
name = list
grid-column = 1/2
grid-row = 2/3
limit = 10

[Timeline]
name = test
grid-column = 2/3
grid-row = 2/3
`

module.exports = class BackendHome extends React.Component {
  constructor() {
    super();

    this.state = {
      layout: defaultLayout,
      editingLayout: defaultLayout,
      showEdit: false,
    }
  }

  render() {
    const { backend, dataset, updateOpts } = this.props
        , { Layout={} } = this.props.opts
        , { layout } = this.state

    return (
      h(Box, [
        h(Flex, {
          justifyContent: 'space-around',
          pb: 2,
        }, [
          h(Text, { mx: 1 }, [
            h('button', {
              onClick: () => this.setState(prev => ({ showEdit: !prev.showEdit })),
            }, 'Edit layout'),

          ]),

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

        this.state.showEdit && h(Box, { pt: 2 }, [
          h(Box, [
            h('textarea', {
              style: { width: '100%' },
              rows: 25,
              value: this.state.editingLayout,
              onChange: e => this.setState({ editingLayout: e.target.value }),
            }),
          ]),
          h(Box, [
            h('button', {
              disabled: this.state.layout === this.state.editingLayout,
              onClick: () => this.setState({ layout: this.state.editingLayout })
            }, 'Update')
          ]),
        ]),

        h(Box, { pt: 2 }, [
          h(AuthorityLayout, {
            layout,
            backend,
            dataset,
            blockOpts: Layout,
            onBlockOptsChange: updatedOpts =>
              updateOpts(R.set(R.lensProp('Layout'), updatedOpts))
          }),
        ]),
      ])
    )
  }
}
