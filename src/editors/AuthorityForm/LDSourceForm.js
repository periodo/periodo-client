"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , Icon = require('react-geomicons').default
    , Spinner = require('respin')
    , AsyncRequestor = require('../../linked-data/AsyncRequestor')
    , { Box, Heading, Text, Textarea } = require('axs-ui')
    , { fetchLD, match } = require('../../linked-data/utils/source_ld_match')
    , { Button$Primary, Button$Danger, Source, Link } = require('lib/ui')


const LDInput = AsyncRequestor(class LDInput extends React.Component {
  constructor() {
    super();

    this.state = {
      input: ''
    }
  }

  render() {
    const { input } = this.state
        , { doRequest, clearRequest, readyState, onNextCompletion, onValueChange } = this.props
        , sourceMatch = match(input)

    return (
      h(Box, [
        h(Text, 'Paste text in the block below that contains one of the following'),

        h(Box, { is: 'ul' }, [
          h(Box, { is: 'li' }, [
            'A URL of a record in the ',
            h(Link, { href: 'https://worldcat.org' }, 'WorldCat database'),
          ]),

          h(Box, { is: 'li' }, [
            'A DOI contained in the ',
            h(Link, { href: 'https://search.crossref.org' }, 'CrossRef database')
          ]),
        ]),

        h(Textarea, {
          rows: 6,
          onChange: e => {
            this.setState({ input: e.target.value });
          }
        }),

        h(Button$Primary, {
          disabled: sourceMatch === null,
          onClick: () => {
            clearRequest(() => {
              onNextCompletion((err, value) => {
                if (!err) {
                  onValueChange(value)
                }
              })

              doRequest(fetchLD, sourceMatch);
            })
          }
        }, h(Icon, { name: 'refresh' })),

        readyState && h(Box, { display: 'inline', ml: 1 }, readyState.case({
          Pending: () => ([
            h(Spinner)
          ]),

          Failure: err => {
            console.error(err);

            return h(Text, 'Failed to fetch source')
          },

          _: R.always('null')
        })),
      ])
    )
  }
})

const LinkedDataSourceForm = ({ value, onValueChange }) =>
  h(Box, [
    h(Heading, { level: 3 }, 'Linked data source'),

    value
      ? h(Box, [
          h(Source, { source: value }),
          h(Box, [
            h(Text, 'Incorrect source?'),
            h(Box, [
              h(Button$Danger, {
                onClick: () => {
                  onValueChange(null)
                }
              }, '‹ Reset')
            ])
          ]),
        ])
      : h(LDInput, { onValueChange })
  ])

module.exports = AsyncRequestor(LinkedDataSourceForm)
