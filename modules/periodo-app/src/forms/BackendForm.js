"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , { Flex, Box, Input, Label, Link, Select, Textarea } = require('periodo-ui')
    , { Button$Primary, Button$Danger, Alert$Error } = require('periodo-ui')
    , { isDataset } = require('periodo-utils').dataset


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
    this.handleFileChange = this.handleFileChange.bind(this);
    this.isValidState = this.isValidState.bind(this);
  }

  handleChange(e) {
    if (e.target.name === 'type') {
      this.setState({
        file: null,
        url: '',
        label: '',
        description: '',
        type: e.target.value,
      });
    } else {
      this.setState({ [e.target.name]: e.target.value });
    }
  }

  async handleFileChange(e) {
    const el = e.target
        , file = el.files[0]

    this.setState({
      file: null,
      fileError: null,
    })

    let text

    try {
      text = await new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => {
          resolve(reader.result)
        }

        reader.onerror = () => {
          reject(reader.error)
        }

        reader.readAsText(file)
      })
    } catch (e) {
      this.setState({ fileError: 'Could not read file' })
      return
    }

    try {
      const obj = JSON.parse(text)

      if (!isDataset(obj)) {
        throw new Error()
      }
    } catch (e) {
      this.setState({ fileError: 'File is not a valid PeriodO dataset' })
      return
    }

    this.setState(prev => {
      const updated = { file }

      if (!prev.label) {
        prev.label = file.name
      }

      return {
        ...prev,
        ...updated,
      }
    })
  }

  isValidState() {
    const { type, label, url, file } = this.state

    let isValid = !!type && !!label

    if (type === 'Web') {
      isValid = isValid && !!url;
    }

    if (type === 'StaticFile') {
      isValid = isValid && !!file
    }

    return isValid;
  }

  render() {
    const { handleSave, handleDelete } = this.props
        , { label, description, url, type, fileError } = this.state

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
            h('option', { value: 'IndexedDB' }, 'In-browser (editable)'),
            h('option', { value: 'Web' }, 'Web (read-only)'),
            h('option', { value: 'StaticFile' }, 'File (read-only)'),
          ]),
        ]),

        h('div', [
          type === 'StaticFile' && h(Label, {
            mt: 3,
            htmlFor: 'file',
            isRequired: true,
          }, 'File'),

          type === 'StaticFile' && h(Box, [
            h(Input, {
              id: 'file',
              name: 'file',
              type: 'file',
              disabled: !!this.editing,
              onChange: this.handleFileChange,
            }),

            fileError && h(Alert$Error, { mt: 2 }, [
              fileError,
            ]),
          ]),

          h(Label, {
            mt: 3,
            htmlFor: 'label',
            isRequired: true,
          }, 'Label'),

          h(Input, {
            id: 'label',
            name: 'label',
            type: 'text',
            value: label || '',
            onChange: this.handleChange,
          }),

          type === 'Web' && h(Label, {
            mt: 3,
            htmlFor: 'url',
            isRequired: true,
          }, 'URL'),

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

          h(Label, {
            mt: 3,
            htmlFor: 'description',
          }, 'Description'),

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
