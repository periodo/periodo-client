"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { RandomID } = require('periodo-common')
    , { Flex, Box, Label, Input, HelpText } = require('periodo-ui')
    , { InputBlock, TextareaBlock, Button } = require('periodo-ui')

const emptyCreator = { name: '' }

module.exports = RandomID(class NonLDSourceForm extends React.Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const { onValueChange } = this.props
        , { name, value } = e.target

    if (!onValueChange) return;

    const fn = value
      ? R.assoc(name, value)
      : R.omit(name)

    onValueChange(fn(this.props.value))
  }

  render() {
    const { onValueChange, sameAs } = this.props
        , value = this.props.value || {}



    return (
      h(Box, { p: 3 }, [
        h(TextareaBlock, {
          name: 'citation',
          label: 'Citation (required)',
          helpText: `Include any identifying information for this source.
A full citation is encouraged, but a title alone is sufficient.`,
          value: value.citation || '',
          rows: 4,
          onChange: this.handleChange,
        }),


        h(InputBlock, {
          my: 3,
          name: 'title',
          label: 'Title',
          value: value.title || '',
          onChange: this.handleChange,
        }),

        h(InputBlock, {
          my: 3,
          name: 'url',
          label: 'URL',
          value: (value.url || '').trim(),
          onChange: this.handleChange,
        }),

        h(InputBlock, {
          my: 3,
          name: 'sameAs',
          label: 'Same as (read-only)',
          value: sameAs || '',
          disabled: true,
        }),

        h(InputBlock, {
          my: 3,
          name: 'yearPublished',
          label: 'Year published',
          value: (value.yearPublished || '').toString().trim(),
          onChange: this.handleChange,
        }),

        [ 'creators', 'contributors' ].map(field => {
          const list = R.propOr([ emptyCreator ], field, value)

          return h(Box, {
            key: field,
            mt: 3,
          }, [
            h(Label, { htmlFor: this.props.randomID(field) + '-0' },
              field[0].toUpperCase() + field.slice(1)),

            h(HelpText, [
              field === 'creators'
                ? 'Creators are primarily responsible for the content of a source'
                : '',
            ]),

            h(Box, list.map((agent, i) =>
              h(Flex, {
                mt: i > 0 ? 3 : 0,
                key: field + i,
              }, [
                h(Input, {
                  name: field,
                  id: this.props.randomID(field) + '-' + i,
                  value: agent.name || '',
                  onChange: e => {
                    onValueChange(
                      R.assocPath([ field, i, 'name' ], e.target.value, value))
                  },
                }),

                h(Button, {
                  ml: 1,
                  fontWeight: 'bold',
                  onClick: () => {
                    onValueChange(R.over(
                      R.lensProp(field),
                      cs => R.insert(i + 1, emptyCreator, (cs || [])),
                      value
                    ))
                  },
                }, '+'),

                h(Button, {
                  ml: 1,
                  fontWeight: 'bold',
                  onClick: () => {
                    onValueChange(R.over(
                      R.lensProp(field),
                      cs => (cs || []).length > 1
                        ? R.remove(i, 1, cs)
                        : [ emptyCreator ],
                      value
                    ))
                  },
                },'-'),
              ])
            )),
          ])
        }),
      ])
    )
  }
})
