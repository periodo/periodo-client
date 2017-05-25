"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , { Box, Input, Label, Select, Textarea } = require('axs-ui')
    , { PrimaryButton } = require('../../../ui')


module.exports = class BackendForm extends React.Component {
  constructor() {
    super();

    this.state = {
      type: 'IndexedDB',
    }

    this.handleChange = this.handleChange.bind(this);
    this.isValidState = this.isValidState.bind(this);
  }

  handleChange(e) {
    if (e.target.name === 'type') {
      this.setState({ type: e.target.value });
    } else {
      this.setState({ [e.target.name]: e.target.value });
    }
  }

  isValidState() {
    const { type, label, url } = this.state

    let isValid = !!type && !!label

    if (type === 'Web') {
      isValid = isValid && !!url;
    }

    return isValid;
  }

  render() {
    const { handleSave } = this.props
        , { label, description, url, type } = this.state

    return (
      h(Box, { width: 400 }, [
        h('div', [
          h(Label, { htmlFor: 'type' }, 'Type'),

          h(Select, {
            id: 'type',
            name: 'type',
            value: type,
            onChange: this.handleChange,
          }, [
            h('option', { value: 'IndexedDB' }, 'Local (editable)'),
            h('option', { value: 'Web' }, 'Web (read-only)'),
          ])
        ]),

        h('div', [
          h(Label, { mt: 1, htmlFor: 'label' }, 'Label'),

          h(Input, {
            id: 'label',
            name: 'label',
            type: 'text',
            value: label || '',
            onChange: this.handleChange
          }),

          type === 'Web' && h(Label, { mt: 1, htmlFor: 'url' }, 'URL'),

          type === 'Web' && h(Input, {
            id: 'url',
            name: 'url',
            label: 'URL',
            value: url || '',
            onChange: this.handleChange
          }),

          h(Label, { mt: 1, htmlFor: 'description' }, 'Description'),

          h(Textarea, {
            rows: 4,
            id: 'description',
            name: 'description',
            value: description || '',
            onChange: this.handleChange
          }),

        ]),

        h('div', [
          h(PrimaryButton, {
            mt: 1,
            px: 2,
            onClick: () => handleSave(this.state),
            disabled: !this.isValidState()
          }, 'Add')
        ])
      ])
    )
  }
};
