"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Icon = require('react-geomicons')
    , Spinner = require('respin')
    , AsyncRequestor = require('../../linked-data/AsyncRequestor')
    , { Box, Heading, Text, Textarea } = require('axs-ui')
    , fetchLD = require('../../linked-data/utils/source_ld_fetch')
    , { InputBlock, PrimaryButton, DangerButton, Source } = require('../../ui')


// Given a url, check if URL is a valid LD source. If it is, return a LD URI
// (which might be prefixed by a proxy, or transformed in some way because of
// CORS restrictions). If it is not, return null.
const WORLDCAT_REGEX = /worldcat.org\/.*?oclc\/(\d+).*/i
    , DOI_REGEX = /(?:dx.doi.org\/|doi:)([^\/]+\/[^\/\s]+)/

function toValidSourceURL(text='') {
  let url = null

  if (text.match(WORLDCAT_REGEX)) {
    url = 'http://www.worldcat.org/oclc/' + text.match(WORLDCAT_REGEX)[1];
  } else if (text.match(DOI_REGEX)) {
    url = 'http://dx.doi.org/' + text.match(DOI_REGEX)[1];
  }

  return url;
}


const HelpText = [
  h(Text, 'Paste text in the block below that contains a URL from a site supported by PeriodO.'),
  h(Text, 'Currently supported formats:'),
  h('ul', [
    h('li', [
      'URLs from the ',
      h('a', { href: 'http://worldcat.org' }, 'WorldCat'),
      ' catalog.'
    ]),

    h('li', [
      'URLs to the ',
      h('a', { href: 'http://dx.doi.org' }, 'DOI lookup service'),
      ' searchable with ',
      h('a', { href: 'http://crossref.org' }, 'CrossRef')
    ]),

    h('li', [
      'A DOI in the format doi:xxx.yyy (as included in many citation styles)'
    ])
  ])
]

class LinkedDataSourceForm extends React.Component {
  constructor() {
    super();

    this.state = {
      urlInput: '',
    }
  }

  render() {
    const { doRequest, clearRequest, readyState } = this.props
        , possibleSourceURL = toValidSourceURL(this.state.urlInput)

    return (
      h(Box, [
        h(Heading, { level: 3 }, 'Linked data source'),

        h(Box, [
          ...HelpText,

          h(Textarea, {
            rows: 6,
            onChange: e => {
              this.setState({ urlInput: e.target.value });
            }
          }),

          h(PrimaryButton, {
            disabled: !!possibleSourceURL,
            onClick: () => {
              if (readyState) clearRequest();

              doRequest(fetchLD, possibleSourceURL, { populateCache: false });
            }
          }, h(Icon, { name: 'refresh' })),
        ]),

        readyState && h(Box, {}, readyState.case({
          Pending: () => ([
            h(Spinner)
          ]),

          Failure: err => {
            console.error(err);

            return h(Text, 'Failed to fetch source')
          },

          Success: resp => ([
            h(Source, { data: resp }),

            h(Box, [
              h(Text, 'Incorrect source?'),
              h(Box, [
                h(DangerButton, {
                  onClick: this.props.onReset
                }, '‹ Reset')
              ])
            ]),

            h(InputBlock, {
              mt: 2,
              label: 'Locator',
              value: this.props.source.get('locator'),
              onChange: this.props.onLocatorChange,
              helpText: `
                If all periods are defined on a single page within this source,
                include that page number here. Otherwise, include a locator for
                individual period definitions as you create them.
              `
            }),
          ])
        }))
      ])
    )
  }
}

module.exports = AsyncRequestor(LinkedDataSourceForm)

  /*
const 

  handleFetch(source) {
    this.props.onSourceChange(source);
  },

  handleLocatorChange(e) {
    var locator = e.target.value
      , source = this.props.data
      , newSource

    newSource = source.has('partOf') ?
      source.set('locator', locator) :
      Immutable.Map({ partOf: source, locator })

    if (!locator) newSource = newSource.get('partOf');

    this.props.onSourceChange(newSource);
  },

  handleReset() {
    this.setState({ fetchedSource: null }, () => this.props.onSourceChange(null));
  },

  render() {
    return this.props.data ?
      <AcceptData
        onReset={this.handleReset}
        source={this.props.data}
        onLocatorChange={this.handleLocatorChange} /> :
      <FetchData onFetch={this.handleFetch} />
  }
});
  */
