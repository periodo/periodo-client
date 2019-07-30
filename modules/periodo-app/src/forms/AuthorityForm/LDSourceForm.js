"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , Icon = require('react-geomicons').default
    , Spinner = require('respin')
    , { connect } = require('react-redux')
    , { Box, Text, Textarea } = require('periodo-ui')
    , { asURL, match } = require('../../linked-data/utils/source_ld_match')
    , LinkedDataAction = require('../../linked-data/actions')
    , { Button$Primary, Button$Danger, Source, Link } = require('periodo-ui')


class LDInput extends React.Component {
  constructor() {
    super();

    this.state = {
      input: '',
      readyState: null,
    }
  }

  render() {
    const { input, readyState } = this.state
        , { dispatch, onValueChange } = this.props
        , sourceMatch = match(input)

    return (
      h(Box, [
        h(Text, 'Paste text in the block below that contains one of the following'),

        h(Box, {
          is: 'ul',
          ml: 3,
          mb: 3,
        }, [
          h(Box, { is: 'li', mt: 1 }, [
            'A URL of a record in the ',
            h(Link, { href: 'https://worldcat.org' }, 'WorldCat database'),
          ]),

          h(Box, { is: 'li', my: 1 }, [
            'A DOI contained in the ',
            h(Link, { href: 'https://search.crossref.org' }, 'CrossRef database'),
          ]),
        ]),

        h(Textarea, {
          rows: 6,
          onChange: e => {
            this.setState({ input: e.target.value });
          },
        }),

        h(Button$Primary, {
          disabled: sourceMatch === null,
          onClick: () => {
            const url = asURL(sourceMatch)
                , req = dispatch(LinkedDataAction.FetchSource(url, {}))

            this.setState({ readyState: req.readyState })

            req.then(resp => {
              resp.readyState.case({
                Success: ({ source }) => {
                  onValueChange(source)
                },
                _: () => null,
              })
            })
          },
        }, h(Icon, { name: 'refresh' })),

        readyState && h(Box, { display: 'inline', ml: 1 }, readyState.case({
          Pending: () => ([
            h(Spinner),
          ]),

          Failure: err => {
            // eslint-disable-next-line no-console
            console.error(err);

            return h(Text, 'Failed to fetch source')
          },

          _: R.always('null'),
        })),
      ])
    )
  }
}

const LinkedDataSourceForm = ({ dispatch, value, onValueChange }) =>
  h(Box, [
    value
      ? h(Box, [
          h(Source, { value }),
          h(Box, { mt: 3 }, [
            h(Text, 'Incorrect source?'),
            h(Box, [
              h(Button$Danger, {
                onClick: () => {
                  onValueChange(null)
                },
              }, '‹ Reset'),
            ]),
          ]),
        ])
      : h(LDInput, { dispatch, onValueChange }),
  ])

module.exports = connect()(LinkedDataSourceForm)
