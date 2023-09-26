"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Route } = require('org-shell')
    , { Heading, Box, InlineText, MonospaceText, Link, DownloadValue } = require('periodo-ui')
    , { PermalinkValue, Section, EditorialNote } = require('periodo-ui')
    , { HelpText  } = require('periodo-ui')
    , util = require('periodo-utils')
    , AuthorityLayoutRenderer = require('../../layouts/authorities')
    , debounce = require('debounce')

const layout = `
[Search]
type = period-search
section = Filter periods

[TimeFilter]
type = time-filter
section = Filter periods

[PlaceFilter]
type = place-filter
section = Filter periods

[Facets]
type = facets
section = Filter periods
height = 200
hiddenAspects = authority
aspectProportions = 33%,67%

[SpatialCoverage]
type = spatial-visualization
section = Spatial coverage

[TimeRange]
type = timespan-visualization
section = Temporal coverage
height = 200

[PeriodList]
type = windowed-period-list
section = Periods

[AuthorityPeriodDetail]
type = authority-period-detail
section = Periods
`

module.exports = class AuthorityLayout extends React.Component {
  constructor(props) {
    super(props)

    this.state = { blockOpts: this.props.opts.Layout || {}}
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

    const description = util.authority.describe(authority)

    return h(Box, [
      h(Section, [

        h(Heading, {
          level: 2,
          mb: 2,
        }, description.source),

        h(Box, { mb:2 }, [
          h(InlineText, {
            fontSize: 3,
            color: 'gray.6',
          }, 'Permalink '),

          h(PermalinkValue, {
            value: description.id,
            fontSize: 3,
          }),
        ]),

        h(Box, {
          mb: description.editorialNote ? 2 : 0,
          fontSize: 3,
        }, [
          h(InlineText, { color: 'gray.6' }, 'Download '),
          h(DownloadValue, {
            value: description.id,
            includeCSV: true,
          }),
        ]),

        description.editorialNote && h(EditorialNote, {
          text: description.editorialNote,
        }),
      ]),

      description.periods === 0
        ? h(HelpText, [
          'No periods in this authority.',
          h(Link, {
            ml: 1,
            route: new Route('authority-add-period', {
              backendID: backend.asIdentifier(),
              authorityID: authority.id,
            }),
          }, 'Add a period'),
        ])
        : (
          h(AuthorityLayoutRenderer, {
            data: Object.values(authority.periods),
            backend,
            dataset,
            gazetteers,
            layout,
            shellOpts: opts,
            updateShellOpts: updateOpts,
            defaultYearRangeStart: description.earliest
              ? description.earliest.iso
              : null,
            blockOpts,
            onBlockOptsChange: updatedOpts => {
              this.setState({ blockOpts: updatedOpts }, this.persistBlockOpts)
            },
          })
        ),
    ])
  }
}
