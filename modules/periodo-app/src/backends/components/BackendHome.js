"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Tabs, Box } = require('periodo-ui')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')
    , debounce = require('debounce')

const periodLayout = `
grid-template-columns = repeat(6, 1fr)
grid-template-rows = repeat(6, auto)
grid-gap = 1em 1.66em

[Search]
type = text-search
grid-column = 1/7
grid-row = 1/2

[PlaceFilter]
type = place-filter
grid-column = 1/7
grid-row = 2/3

[Facets]
type = facets
flex = true
height = 156
grid-column = 1/7
grid-row = 3/4

[SpatialCoverage]
type = spatial-visualization
grid-column = 4/7
grid-row = 4/5

[TimeRange]
type = timespan-visualization
grid-column = 1/4
grid-row = 4/5
height = 200

[PeriodList]
type = windowed-period-list
grid-column = 1/7
grid-row = 5/6

[PeriodDetail]
type = period-detail
grid-column = 1/4
grid-row = 6/7

[AuthorityDetail]
type = authority-detail
grid-column = 4/7
grid-row = 6/7
`

const authorityLayout = `
[AuthorityList]
type = authority-list
`


module.exports = class BackendHome extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // layout: defaultLayout,
      // editingLayout: defaultLayout,
      // showEdit: false,
      blockOpts: this.props.opts.Layout || {
        Facets: {
          flexBasis: {
            authority: '50%',
            language: '25%',
            spatialCoverage: '25%',
          },
        },
      },
    }

    this.persistBlockOpts = debounce(this.persistBlockOpts.bind(this), 50)
  }

  persistBlockOpts() {
    const { updateOpts } = this.props
        , { blockOpts } = this.state

    R.isEmpty(blockOpts)
      ? updateOpts(R.dissoc('Layout'))
      : updateOpts(R.set(R.lensProp('Layout'), blockOpts))
  }

  render() {
    const { backend, dataset, updateOpts, gazetteers } = this.props
        , { Tab='Periods' } = this.props.opts
        , { blockOpts } = this.state

    const childProps = {
      backend,
      dataset,
      blockOpts,
      gazetteers,
      onBlockOptsChange: updatedOpts => {
        this.setState({ blockOpts: updatedOpts }, this.persistBlockOpts)
      },
    }

    const renderPeriodTab = () => (
      dataset.periods.length === 0
        ? (
          h(Box, {
            fontSize: 4,
            color: 'gray.8',
            textAlign: 'center',
          }, 'No periods in backend')
        )
        : (
          h(AuthorityLayoutRenderer, {
            ...childProps,
            layout: periodLayout,
          }))
    )

    const renderAuthorityTab = () => h(AuthorityLayoutRenderer, {
      ...childProps,
      useAuthorities: true,
      layout: authorityLayout,
    })

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
            },
          ],
        }),
      ])
    )
  }
}
