"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Heading, Box, Span, Text, DownloadValue } = require('periodo-ui')
    , { PermalinkValue, LinkifiedTextValue  } = require('periodo-ui')
    , { authority: { describe }} = require('periodo-utils')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')
    , debounce = require('debounce')

const authorityLayout = `
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
scroll-to = true

[PeriodDetail]
type = period-detail
grid-column = 1/4
grid-row = 6/7

[AuthorityDetail]
type = authority-detail
grid-column = 4/7
grid-row = 6/7
`

module.exports = class AuthorityLayout extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      blockOpts: this.props.opts.Layout || {
        Facets: {
          selected: { authority: [ props.authority.id ]},
          hidden: [ 'authority' ],
          flexBasis: {
            language: '33%',
            spatialCoverage: '67%',
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
    const {
      backend,
      dataset,
      authority,
      gazetteers,
      params: { periodID },
    } = this.props

    const { blockOpts } = this.state

    const selectedPeriod = dataset.periodByID(periodID)

    const childProps = {
      backend,
      dataset,
      gazetteers,
      blockOpts,
      onBlockOptsChange: updatedOpts => {
        this.setState({ blockOpts: updatedOpts }, this.persistBlockOpts)
      },
    }

    const description = describe(authority)

    return h(Box, [
      h(Heading, {
        level: 2,
        mb: 2,
      }, description.source),

      h(Box, { mb:2 }, [
        h(Span, {
          fontSize: 3,
          color: 'gray.6',
        }, 'Permalink '),

        h(PermalinkValue, {
          value: description.id,
          fontSize: 3,
        }),
      ]),

      h(Box, {
        mb: 2,
        fontSize: 3,
      }, [
        h(Span, { color: 'gray.6' }, 'Download '),
        h(DownloadValue, {
          value: description.id,
          includeCSV: true,
        }),
      ]),

      h(Text,
        {
          mb: 3,
          maxWidth: '60em',
        },
        h(LinkifiedTextValue, {
          value: { text: description.editorialNote },
        })
      ),

      description.periods === 0
        ? (
          h(Box, {
            fontSize: 4,
            color: 'gray.8',
          }, 'No periods in this authority.')
        )
        : (
          h(AuthorityLayoutRenderer, {
            ...childProps,
            layout: authorityLayout,
            selectedPeriod,
          })
        ),
    ])
  }
}
