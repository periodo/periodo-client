"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , RandomID = require('../../utils/RandomID')
    , { Box, Label, Heading, Input } = require('axs-ui')
    , { InputBlock, TextareaBlock, DefaultButton } = require('../../ui')

class NonLDSourceForm extends React.Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const { name, value } = e.target

    this.setState(prev => ({
      data: value ? prev.data.set(name, value) : prev.data.delete(name)
    }), this.handleSourceChange);
  }

  handleSourceChange() {
    const source = this.state.data
        .map(val => val instanceof Immutable.Iterable ? val.filter(v => v) : val)
        .filter(val => val instanceof Immutable.Iterable ? val.size : val.length)

    this.props.onSourceChange(source);
  }

  handleNameChange(type, idx, e) {
    const value = e.target.value;

    this.setState(prev => ({
      data: prev.data.update(type, names => names.update(idx, name => name.set('name', value)))
    }), this.handleSourceChange);
  }

  handleNameRemove(type, idx) {
    let newState = this.state.data.get(type).delete(idx)

    if (!newState.size) newState = newState.push('');

    this.setState(prev => ({
      data: prev.data.set(type, newState)
    }), this.handleSourceChange);
  }

  handleNameAdd(type, idx) {
    if (!this.state.data.get(type).get(idx)) return;

    this.setState(prev => ({
      data: prev.data.update(type, names => names.splice(idx + 1, 0, Immutable.Map({ name: '' })))
    }), this.handleSourceChange)
  }

  render() {
    return (
      h(Box, [
        h(Heading, { level: 3 }, 'Non linked data source'),

        h(TextareaBlock, {
          name: 'citation',
          label: 'Citation (required)',
          helpText: `Include any identifying information for this source. A full formatted citation is encouraged, but a title alone is sufficient.`,
          value: this.state.data.get('citation'),
          rows: 4,
          onChange: this.handleChange,
        }),


        h(InputBlock, {
          name: 'title',
          label: 'Title',
          value: this.state.data.get('title'),
          onChange: this.handleChange
        }),

        h(InputBlock, {
          name: 'url',
          label: 'URL',
          value: this.state.data.get('url'),
          onChange: this.handleChange
        }),

        h(InputBlock, {
          name: 'sameAs',
          label: 'Same as (read-only)',
          value: this.state.data.get('sameAs'),
          disabled: true
        }),

        h(InputBlock, {
          name: 'yearPublished',
          label: 'Year published',
          value: this.state.data.get('yearPublished'),
          onChange: this.handleChange
        }),


        ['creators', 'contributors'].map(field =>
          h(Box, { key: field }, [
            h(Label, { htmlFor: this.props.randomID(field) + '-0' }, field[0].toUpperCase() + field.slice(1)),
            h(Box, this.state.data.get(field).map((name, i) =>
              h(Box, { key: field + i }, [
                h(Input, {
                  name: field,
                  id: this.props.randomID(field) + '-' + i,
                  value: name.get('name'),
                  onChange: this.handleNameChange.bind(this, field, i)
                }),

                h(DefaultButton, {
                  size: 1,
                  fontWeight: 'bold',
                  onClick: this.handleNameAdd.bind(this, field, i)
                }, '+'),

                h(DefaultButton, {
                  size: 1,
                  fontWeight: 'bold',
                  onClick: this.handleNameRemove.bind(this, field, i)
                },'-')
              ])
            ))
          ])
        )
      ])
    )
  }
}

module.exports = RandomID(NonLDSourceForm);
