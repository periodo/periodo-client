"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Route } = require('org-shell')
    , { Box, Span, Heading, Text, Section, Breadcrumb } = require('periodo-ui')
    , { Link, PermalinkValue, Note, EditorialNote } = require('periodo-ui')
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
    const { backend, dataset, authority, period, gazetteers } = this.props
        , { blockOpts } = this.state

    return h(Box, [

      h(Breadcrumb, {
        truncate: [ 1 ],
      }, [
        h(Link, {
          route: Route('backend-home', {
            backendID: backend.asIdentifier(),
          }),
        }, backend.metadata.label),
        h(Link, {
          route: Route('authority-view', {
            backendID: backend.asIdentifier(),
            authorityID: authority.id,
          }),
        }, util.authority.displayTitle(authority)),
        period.label,
        'View',
      ]),

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
          fontSize: 3,
        }, [
          h(Span, { color: 'gray.6' }, 'Download '),
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
        onBlockOptsChange: updatedOpts => {
          this.setState({ blockOpts: updatedOpts }, this.persistBlockOpts)
        },
        layout: periodLayout,
        fixedPeriod: period,
      }),
    ])
  }
}
