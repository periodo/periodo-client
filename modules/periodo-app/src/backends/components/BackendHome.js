"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Tabs, Box } = require('periodo-ui')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')

const periodLayout = `
grid-template-columns = repeat(3, 1fr)
grid-template-rows = repeat(5, auto)
grid-gap = 1em 1.66em

[Search]
type = text-search
grid-column = 1/2
grid-row = 1/2

[Facets]
type = facets
flex = true
height = 200
grid-column = 1/4
grid-row = 2/3

[TimeRange]
type = timespan-visualization
grid-column = 2/4
grid-row = 1/2
height = 256

[PeriodList]
type = windowed-period-list
grid-column = 1/4
grid-row = 3/4

[HoveredPeriod]
type = hovered-period
grid-column = 1/4
grid-row = 4/5
`

const authorityLayout = `
[AuthorityList]
type = authority-list
`


module.exports = class BackendHome extends React.Component {
  /*
  constructor() {
    super();

    this.state = {
      //layout: defaultLayout,
      //editingLayout: defaultLayout,
      showEdit: false,
    }
  }
  */

  render() {
    const { backend, dataset, updateOpts } = this.props
        , { Layout={}, Tab='Periods' } = this.props.opts
        //, { layout } = this.state

    const childProps = {
      backend,
      dataset,
      blockOpts: Layout,
      onBlockOptsChange: updatedOpts =>
        R.isEmpty(updatedOpts)
          ? updateOpts(R.dissoc('Layout'))
          : updateOpts(R.set(R.lensProp('Layout'), updatedOpts))
    }

    const renderPeriodTab = () => h(AuthorityLayoutRenderer, Object.assign({}, childProps, {
      layout: periodLayout,
    }))

    const renderAuthorityTab = () => h(AuthorityLayoutRenderer, Object.assign({}, childProps, {
      layout: authorityLayout,
    }))

    return (
      h(Box, [
        /*
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

        this.state.showEdit && h(Box, { pt: 2 }, [
          h(LayoutEditor, {
            blocks,
            value: this.state.editingLayout,
            onChange: e => this.setState({ editingLayout: e.target.value }),
          }),

          h(Box, { pt: 2 }, [
            h('button', {
              disabled: this.state.layout === this.state.editingLayout,
              onClick: () => this.setState({ layout: this.state.editingLayout })
            }, 'Update')
          ]),
        ]),

        h(Box, {
          is: 'hr',
          mt: 2,
        }),
        */

        h(Tabs, {
          pt: 2,
          value: Tab,
          onChange: val => {
            updateOpts(R.assoc('Tab', val))
          },
          tabs: [
            {
              id: 'Periods',
              label: 'Periods',
              renderTab: renderPeriodTab,
            },
            {
              id: 'Authorities',
              label: 'Authorities',
              renderTab: renderAuthorityTab,
            }
          ]
        }),
      ])
    )
  }
}
