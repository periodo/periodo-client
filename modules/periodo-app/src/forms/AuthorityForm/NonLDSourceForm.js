"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { RandomID } = require('periodo-common')
    , { Flex, Box, Label, Input } = require('periodo-ui')
    , { InputBlock, TextareaBlock, Button$Default } = require('periodo-ui')

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
    const { onValueChange } = this.props
        , value = this.props.value || {}



    return (
      h(Box, [
        h(TextareaBlock, {
          name: 'citation',
          label: 'Citation (required)',
          helpText: `Include any identifying information for this source. A full formatted citation is encouraged, but a title alone is sufficient.`,
          value: value.citation || '',
          rows: 4,
          onChange: this.handleChange,
        }),


        h(InputBlock, {
          name: 'title',
          label: 'Title',
          value: value.title || '',
          onChange: this.handleChange
        }),

        h(InputBlock, {
          name: 'url',
          label: 'URL',
          value: value.url || '',
          onChange: this.handleChange
        }),

        h(InputBlock, {
          name: 'sameAs',
          label: 'Same as (read-only)',
          value: value.sameAs || '',
          disabled: true
        }),

        h(InputBlock, {
          name: 'yearPublished',
          label: 'Year published',
          value: value.yearPublished || '',
          onChange: this.handleChange
        }),


        ['creators', 'contributors'].map(field => {
          const list = R.defaultTo(R.prop(field, value), [emptyCreator])

          return h(Box, { key: field }, [
            h(Label, { htmlFor: this.props.randomID(field) + '-0' }, field[0].toUpperCase() + field.slice(1)),
            h(Box, list.map((agent, i) =>
              h(Flex, { key: field + i }, [
                h(Input, {
                  name: field,
                  id: this.props.randomID(field) + '-' + i,
                  value: agent.name || '',
                  onChange: e => {
                    onValueChange(
                      R.assocPath([field, i, 'name'], e.target.value, value))
                  }
                }),

                h(Button$Default, {
                  size: 1,
                  ml: 1,
                  fontWeight: 'bold',
                  onClick: () => {
                    onValueChange(R.over(
                      R.lensProp(field),
                      cs => (cs || []).splice(i + 1, 0, emptyCreator),
                      value
                    ))
                  }
                }, '+'),

                h(Button$Default, {
                  size: 1,
                  ml: 1,
                  fontWeight: 'bold',
                  onClick: () => {
                    onValueChange(R.over(
                      R.lensProp(field),
                      cs => (cs || []).length < 2
                        ? [emptyCreator]
                        : cs.splice(i, 1),
                      value
                    ))
                  }
                },'-')
              ])
            ))
          ])
        })
      ])
    )
  }
})
