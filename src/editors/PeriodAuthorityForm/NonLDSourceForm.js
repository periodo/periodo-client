"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , RandomID = require('../../utils/RandomID')
    , { Flex, Box, Label, Heading, Input } = require('axs-ui')
    , { InputBlock, TextareaBlock, DefaultButton } = require('../../ui')

class NonLDSourceForm extends React.Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const { source, onValueChange } = this.props
        , { name, value } = e.target

    onValueChange(
      value
        ? source.set(name, value)
        : source.delete(name))
  }

  render() {
    const { source, onValueChange } = this.props

    return (
      h(Box, [
        h(Heading, { level: 3 }, 'Non linked data source'),

        h(TextareaBlock, {
          name: 'citation',
          label: 'Citation (required)',
          helpText: `Include any identifying information for this source. A full formatted citation is encouraged, but a title alone is sufficient.`,
          value: source.get('citation'),
          rows: 4,
          onChange: this.handleChange,
        }),


        h(InputBlock, {
          name: 'title',
          label: 'Title',
          value: source.get('title'),
          onChange: this.handleChange
        }),

        h(InputBlock, {
          name: 'url',
          label: 'URL',
          value: source.get('url'),
          onChange: this.handleChange
        }),

        h(InputBlock, {
          name: 'sameAs',
          label: 'Same as (read-only)',
          value: source.get('sameAs'),
          disabled: true
        }),

        h(InputBlock, {
          name: 'yearPublished',
          label: 'Year published',
          value: source.get('yearPublished'),
          onChange: this.handleChange
        }),


        ['creators', 'contributors'].map(field =>
          h(Box, { key: field }, [
            h(Label, { htmlFor: this.props.randomID(field) + '-0' }, field[0].toUpperCase() + field.slice(1)),
            h(Box, source.get(field, Immutable.fromJS([{ name: '' }])).map((agent, i) =>
              h(Flex, { key: field + i }, [
                h(Input, {
                  name: field,
                  id: this.props.randomID(field) + '-' + i,
                  value: agent.get('name'),
                  onChange: e => {
                    onValueChange(
                      source.setIn([field, i, 'name'], e.target.value))
                  }
                }),

                h(DefaultButton, {
                  size: 1,
                  ml: 1,
                  fontWeight: 'bold',
                  onClick: () => {
                    onValueChange(
                      source.update(field,
                        cs => cs.splice(i + 1, 0, Immutable.Map({ name: '' }))))
                  }
                }, '+'),

                h(DefaultButton, {
                  size: 1,
                  ml: 1,
                  fontWeight: 'bold',
                  onClick: () => {
                    onValueChange(
                      source.update(field,
                        cs => cs.size === 1
                          ? cs.clear().push(Immutable.Map({ name: '' }))
                          : cs.delete(i)))
                  }
                },'-')
              ])
            ).toArray())
          ])
        )
      ])
    )
  }
}

module.exports = RandomID(NonLDSourceForm);
