"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Text } = require('axs-ui')
    , { LayoutEditor } = require('org-layouts')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')
    , blocks = require('../../layouts/authorities/blocks')

const defaultLayout = `
grid-gap = 1em 2.5em
grid-template-columns = 1fr 1fr

[HumanTime]
type = time-cutoff
grid-column = 2/3
grid-row = 1/2

[Search]
type = text-search
grid-column = 1/2
grid-row = 1/2

[PeriodList]
type = period-list
grid-column = 1/2
grid-row = 2/3
limit = 10

[Timeline]
type = timespan-visualization
grid-column = 2/3
grid-row = 2/3
`.trim()


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
            'Created: ' + new Date(backend.metadata.created).toLocaleString(),
          ]),

          h(Text, { mx: 1 }, [
            'Last modified: ' + new Date(backend.metadata.modified).toLocaleString(),
          ]),

          h(Text, { mx: 1 }, [
            'Last accessed: ' + new Date(backend.metadata.accessed).toLocaleString(),
          ]),
        ]),

        h(Flex, [
          h(Text, { mx: 1 }, [
            h('button', {
              onClick: () => this.setState(prev => ({ showEdit: !prev.showEdit })),
            }, 'Edit layout'),
          ]),

          h(Text, { mx: 1 }, [
            h('button', {
              onClick: () => updateOpts(R.dissoc('Layout'))
            }, 'Reset layout'),
          ]),
        ]),

        this.state.showEdit && h(LayoutEditor, { blocks }),

        h(Box, {
          is: 'hr',
          mt: 2,
        }),

        h(Box, { pt: 2 }, [
          h(AuthorityLayoutRenderer, {
            layout,
            backend,
            dataset,
            blockOpts: Layout,
            onBlockOptsChange: updatedOpts =>
              R.isEmpty(updatedOpts)
                ? updateOpts(R.dissoc('Layout'))
                : updateOpts(R.set(R.lensProp('Layout'), updatedOpts))
          }),
        ]),
      ])
    )
  }
}
