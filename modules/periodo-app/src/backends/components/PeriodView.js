"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box, Span, Heading, Text } = require('periodo-ui')
    , { PermalinkValue, LinkifiedTextValue } = require('periodo-ui')
    , { RelatedAuthorityValue, DownloadValue } = require('periodo-ui')
    , { permalink } = require('periodo-utils')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')
    , debounce = require('debounce')

const periodLayout = `
grid-template-columns = repeat(6, 1fr)
grid-template-rows = repeat(5, auto)
grid-gap = 1em 1.66em

[Facets]
type = facets
flex = true
height = 156
grid-column = 1/7
grid-row = 1/2

[SpatialCoverage]
type = spatial-visualization
grid-column = 4/7
grid-row = 2/3

[TimeRange]
type = timespan-visualization
grid-column = 1/4
grid-row = 2/3
height = 200

[PeriodList]
type = windowed-period-list
grid-column = 1/7
grid-row = 3/4

[PeriodDetail]
type = period-detail
grid-column = 1/4
grid-row = 4/5

[AuthorityDetail]
type = authority-detail
grid-column = 4/7
grid-row = 4/5
`

function EditorialNote({ text, ...props }) {
  return h(Text,
    {
      mb: 3,
      maxWidth: '60em',
      ...props,
    },
    h(LinkifiedTextValue, {
      value: { text },
    })
  )
}

function Note({ cite, ...props }) {
  return EditorialNote({
    is: 'blockquote',
    cite,
    ...props,
  })
}

const labelOf = x => (x && x.label) ? x.label : ''

module.exports = class PeriodLayout extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      blockOpts: this.props.opts.Layout || {
        Facets: {
          selected: { authority: [ props.authority.id ]},
          hidden: [ 'authority', 'language', 'spatialCoverage' ],
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
    const { backend, dataset, authority, period, gazetteers } = this.props
        , { blockOpts } = this.state

    const childProps = {
      backend,
      dataset,
      gazetteers,
      blockOpts,
      onBlockOptsChange: updatedOpts => {
        this.setState({ blockOpts: updatedOpts }, this.persistBlockOpts)
      },
    }

    return h(Box, [
      h(Heading, {
        level: 2,
        mb: 2,
      }, period.label),

      h(Text, {
        mb: 2,
        fontSize: 3,
      }, [
        `${ labelOf(period.start) } – ${ labelOf(period.stop) }`,
        period.spatialCoverageDescription
          ? h(Span, { color: 'gray.4' }, ' | ')
          : null,
        `${ period.spatialCoverageDescription || '' }`,
      ]),

      h(Box, {
        mb: 2,
        fontSize: 3,
      }, [
        h(Span, { color: 'gray.6' }, 'Defined by '),
        h(RelatedAuthorityValue, { value: authority }),
      ]),

      h(Box, {
        mb: 2,
        fontSize: 3,
      }, [
        h(Span, { color: 'gray.6' }, 'Permalink '),
        h(PermalinkValue, { value: period.id }),
      ]),

      h(Box, {
        mb: 2,
        fontSize: 3,
      }, [
        h(Span, { color: 'gray.6' }, 'Download '),
        h(DownloadValue, { value: period.id }),
      ]),

      h(Note, {
        text: period.note || '',
        cite: permalink(authority),
      }),

      h(EditorialNote, { text: period.editorialNote || '' }),

      h(AuthorityLayoutRenderer, {
        ...childProps,
        layout: periodLayout,
        fixedPeriod: period,
      }),
    ])
  }
}
