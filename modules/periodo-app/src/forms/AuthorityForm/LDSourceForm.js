"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , Spinner = require('respin')
    , { connect } = require('react-redux')
    , { Box, Text, Textarea, HelpText, RefreshIcon } = require('periodo-ui')
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
      h(Box, { p: 3 }, [
        h(HelpText,
          'Paste into the field below a'),

        h(Box, {
          is: 'ul',
          ml: 3,
          mb: 1,
        }, [
          h(HelpText, {
            is: 'li',
            mt: 1,
          }, [
            'URL from the ',
            h(Link, { href: 'https://worldcat.org' }, 'WorldCat database'),
            ', or a',
          ]),

          h(HelpText, {
            is: 'li',
            mt: 1,
          }, [
            'DOI from the ',
            h(Link, { href: 'https://search.crossref.org' }, 'CrossRef database'),
            ',',
          ]),
        ]),

        h(HelpText,
          'then press the button below to load bibliographic data.'),

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
        }, h(RefreshIcon)),

        readyState && h(Box, {
          display: 'inline',
          ml: 1,
        }, readyState.case({
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
      ? h(Box, { p: 3 },  [
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
      : h(LDInput, {
        dispatch,
        onValueChange,
      }),
  ])

module.exports = connect()(LinkedDataSourceForm)
