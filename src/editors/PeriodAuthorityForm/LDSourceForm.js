"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , Icon = require('react-geomicons').default
    , Spinner = require('respin')
    , AsyncRequestor = require('../../linked-data/AsyncRequestor')
    , { Box, Heading, Text, Textarea } = require('axs-ui')
    , fetchLDSource = require('../../linked-data/utils/source_ld_fetch')
    , toValidSourceURL = require('../../linked-data/utils/source_ld_match')


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

        (!readyState || readyState._name !== 'Success') && h(Box, [
          ...HelpText,

          h(Textarea, {
            rows: 6,
            onChange: e => {
              this.setState({ urlInput: e.target.value });
            }
          }),

          h(PrimaryButton, {
            disabled: !possibleSourceURL,
            onClick: () => {
              clearRequest(() => {
                doRequest(fetchLDSource, possibleSourceURL);
              })
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
            h(Source, { source: Immutable.fromJS(resp) }),

            h(Box, [
              h(Text, 'Incorrect source?'),
              h(Box, [
                h(DangerButton, {
                  onClick: () => {
                    this.setState({ urlInput: '' });
                    clearRequest();
                  }
                }, '‹ Reset')
              ])
            ]),

            /*
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
            */
          ])
        }))
      ])
    )
  }
}


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
module.exports = AsyncRequestor(LinkedDataSourceForm)
