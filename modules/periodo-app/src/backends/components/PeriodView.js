"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box, InlineText, MonospaceText, Heading, Text, Section } = require('periodo-ui')
    , { PermalinkValue, Note, EditorialNote } = require('periodo-ui')
    , { RelatedAuthorityValue, DownloadValue } = require('periodo-ui')
    , util = require('periodo-utils')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')
    , debounce = require('debounce')

const periodLayout = `
[Facets]
type = facets
section = hidden

[PeriodList]
type = windowed-period-list
fixed = true
section = Period details

[AuthorityPeriodDetail]
type = authority-period-detail
section = Period details
`

const labelOf = x => (x && x.label) ? x.label : ''

module.exports = class PeriodLayout extends React.Component {
  constructor(props) {
    super(props)

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
      authority,
      period,
      gazetteers,
      opts,
      updateOpts,
      params,
    } = this.props

    const { blockOpts } = this.state

    if (! authority) {
      if (params.authorityID) {
        return h(Box, [
          h(MonospaceText, [ params.authorityID ]),
          " is not a valid authority identifier.",
          " Perhaps you followed a broken link?"
        ])
      } else {
        return h(Box, [
          "No authority identifier was specified.",
          " Perhaps you followed a broken link?"
        ])
      }
    }

    if (! period) {
      if (params.periodID) {
        return h(Box, [
          h(MonospaceText, [ params.periodID ]),
          " is not a valid period identifier.",
          " Perhaps you followed a broken link?"
        ])
      } else {
        return h(Box, [
          "No period identifier was specified.",
          " Perhaps you followed a broken link?"
        ])
      }
    }

    return h(Box, [
      h(Section, [

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
            ? h(InlineText, { color: 'gray.4' }, ' | ')
            : null,
          `${ period.spatialCoverageDescription || '' }`,
        ]),

        h(Box, {
          mb: 2,
          fontSize: 3,
        }, [
          h(InlineText, { color: 'gray.6' }, 'Defined by '),
          h(RelatedAuthorityValue, { value: authority }),
        ]),

        h(Box, {
          mb: 2,
          fontSize: 3,
        }, [
          h(InlineText, { color: 'gray.6' }, 'Permalink '),
          h(PermalinkValue, { value: period.id }),
        ]),

        h(Box, {
          fontSize: 3,
        }, [
          h(InlineText, { color: 'gray.6' }, 'Download '),
          h(DownloadValue, { value: period.id }),
        ]),

        period.note
          ? h(Note, {
            text: period.note,
            cite: util.permalink(authority),
          })
          : null,

        period.editorialNote
          ? h(EditorialNote, { text: period.editorialNote || '' })
          : null,

      ]),

      h(AuthorityLayoutRenderer, {
        data: Object.values(authority.periods),
        backend,
        dataset,
        gazetteers,
        blockOpts,
        shellOpts: opts,
        updateShellOpts: updateOpts,
        onBlockOptsChange: updatedOpts => {
          this.setState({ blockOpts: updatedOpts }, this.persistBlockOpts)
        },
        layout: periodLayout,
        fixedPeriod: period,
      }),
    ])
  }
}
