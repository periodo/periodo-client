const React = require('react')
    , h = require('react-hyperscript')
    , types = require('../../types')
    , { Box, Button, Input, Label, Select, Textarea } = require('axs-ui')


const {
  INDEXED_DB,
  WEB
} = types.backends


module.exports = React.createClass({
  displayName: 'BackendForm',

  getInitialState() {
    return {
      type: INDEXED_DB
    }
  },

  handleChange(e) {
    if (e.target.name === 'type') {
      this.replaceState({ type: e.target.value });
    } else {
      this.setState({ [e.target.name]: e.target.value });
    }
  },

  isValidState() {
    const { type, label, url } = this.state

    let isValid = !!type && !!label

    if (type === WEB) {
      isValid = isValid && !!url;
    }

    return isValid;
  },

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
            h('option', { value: INDEXED_DB }, 'Local (editable)'),
            h('option', { value: WEB }, 'Web (read-only)'),
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

          type === WEB && h(Label, { mt: 1, htmlFor: 'url' }, 'URL'),

          type === WEB && h(Input, {
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
          h(Button, {
            mt: 1,
            type: 'button',
            onClick: () => handleSave(this.state),
            disabled: !this.isValidState()
          }, 'Add')
        ])
      ])
    )
  }
});
