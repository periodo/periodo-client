"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , { Flex, Box, Input, Label, Link, Select, Textarea } = require('periodo-ui')
    , { Button$Primary, Button$Danger } = require('periodo-ui')


module.exports = class BackendForm extends React.Component {
  constructor(props) {
    super(props);

    if (props.backend) {
      this.editing = true;
    }

    if (this.editing) {
      this.state = {
        type: props.backend.storage._name,
        label: props.backend.metadata.label,
        description: props.backend.metadata.description,
        url: props.backend.storage.url,
      }
    } else {
      this.state = {
        type: 'IndexedDB',
      }
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
    const { handleSave, handleDelete } = this.props
        , { label, description, url, type } = this.state

    return (
      h(Box, { width: 400 }, [

        h('div', [
          h(Label, { htmlFor: 'type' }, 'Type'),

          h(Select, {
            id: 'type',
            name: 'type',
            disabled: !!this.editing,
            value: type,
            onChange: this.handleChange,
          }, [
            h('option', { value: 'IndexedDB' }, 'Local (editable)'),
            h('option', { value: 'Web' }, 'Web (read-only)'),
          ]),
        ]),

        h('div', [
          h(Label, { mt: 3, htmlFor: 'label', isRequired: true }, 'Label'),

          h(Input, {
            id: 'label',
            name: 'label',
            type: 'text',
            value: label || '',
            onChange: this.handleChange,
          }),

          type === 'Web' && h(Label, { mt: 3, htmlFor: 'url', isRequired: true }, 'URL'),

          type === 'Web' && h(Box, [
            h(Input, {
              id: 'url',
              name: 'url',
              label: 'URL',
              disabled: !!this.editing,
              value: url || '',
              onChange: this.handleChange,
            }),

            this.editing ? null : (
              h(Box, [
                h(Box, { level: 4 }, 'Shortcuts'),
                h(Box, [
                  h(Link, {
                    href: '',
                    onClick: e => {
                      e.preventDefault();
                      this.setState({
                        label: 'this URL',
                        url: window.location.origin,
                      })
                    },
                  }, 'this URL'),
                  ` (${window.location.origin})`,
                ]),
                h(Box, [
                  h(Link, {
                    href: '',
                    onClick: e => {
                      e.preventDefault();
                      this.setState({
                        label: 'the canonical PeriodO server',
                        url: 'https://test.perio.do/',
                      })
                    },
                  }, 'the canonical PeriodO server'),
                  ` (https://test.perio.do/)`,
                ]),
              ])
            ),
          ]),

          h(Label, { mt: 3, htmlFor: 'description' }, 'Description'),

          h(Textarea, {
            rows: 4,
            id: 'description',
            name: 'description',
            value: description || '',
            onChange: this.handleChange,
          }),

        ]),

        h(Flex, {
          mt: 3,
          justifyContent: 'space-between',
        }, [
          h(Button$Primary, {
            onClick: this.isValidState() ? (() => handleSave(this.state)) : () => null,
            disabled: !this.isValidState(),
          }, this.editing ? 'Update' : 'Add'),

          this.editing && h(Button$Danger, {
            onClick: () => handleDelete(),
          }, 'Delete'),
        ]),
      ])
    )
  }
};
