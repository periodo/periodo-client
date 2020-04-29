"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Route } = require('org-shell')
    , { Box, HelpText, Link, Breadcrumb } = require('periodo-ui')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')
    , debounce = require('debounce')

const layout = `
[Search]
type = text-search
section = Filter periods

[PlaceFilter]
type = place-filter
section = Filter periods

[TimeFilter]
type = time-filter
section = Filter periods

[Facets]
type = facets
section = Filter periods
flex = true
height = 200

[SpatialCoverage]
type = spatial-visualization
section = Period coverage
height = 200

[TimeRange]
type = timespan-visualization
section = Period coverage
height = 200

[PeriodList]
type = windowed-period-list
section = Periods
scroll-to = true

[AuthorityPeriodDetail]
type = authority-period-detail
section = Periods
`

module.exports = class BackendHome extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      blockOpts: this.props.opts.Layout || {},
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
    const {
      backend,
      dataset,
      gazetteers,
      params: { periodID },
    } = this.props

    const { blockOpts } = this.state

    const selectedPeriod = dataset.periodByID(periodID)

    const childProps = {
      backend,
      dataset,
      blockOpts,
      gazetteers,
      onBlockOptsChange: updatedOpts => {
        this.setState({ blockOpts: updatedOpts }, this.persistBlockOpts)
      },
    }

    return (
      h(Box, [

        h(Breadcrumb, [
          backend.metadata.label,
          'Browse periods',
        ]),

        dataset.authorities.length === 0
          ? h(HelpText, [
            'No authorities in this data source.',
            h(Link, {
              mx: 1,
              route: new Route('backend-add-authority', {
                backendID: backend.asIdentifier(),
              }),
            }, 'Add an authority'),
            'or',
            h(Link, {
              mx: 1,
              route: new Route('backend-sync', {
                backendID: backend.asIdentifier(),
              }),
            }, 'import changes'),
            'from another data source.',
          ])
          : dataset.periods.length === 0
            ? h(HelpText, [
              'No periods in this data source.',
              h(Link, {
                ml: 1,
                route: new Route('backend-authorities', {
                  backendID: backend.asIdentifier(),
                }),
              }, 'Browse authorities'),
            ])
            : h(AuthorityLayoutRenderer, {
              ...childProps,
              layout,
              selectedPeriod,
            }),
      ])
    )
  }
}
