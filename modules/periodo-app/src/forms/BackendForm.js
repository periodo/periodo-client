"use strict";

const React = require('react')
    , h = require('react-hyperscript')
    , isURL = require('is-url')
    , { InputBlock, SelectBlock, TextareaBlock } = require('periodo-ui')
    , { Box, Flex } = require('periodo-ui')
    , { Button$Primary, Button$Danger } = require('periodo-ui')
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
    this.checkValues = this.checkValues.bind(this);
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
      this.setState({ fileError: 'Could not read the file.' })
      return
    }

    try {
      const obj = JSON.parse(text)

      if (!isDataset(obj)) {
        throw new Error()
      }
    } catch (e) {
      this.setState({ fileError: 'This file is not a valid PeriodO dataset.' })
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
      isValid = isValid && !!url
    }

    if (type === 'StaticFile') {
      isValid = isValid && !!file
    }

    return isValid;
  }

  async getPeriodOServerVersion(url) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        redirect: 'follow',
      })
      if (response.ok) {
        return response.headers.get('x-periodo-server-version')
      } else {
        return null
      }
    } catch(e) {
      return null
    }
  }

  async checkValues(handleSave) {
    const { type, url } = this.state

    if (type === 'Web') {
      const fullURL = url.startsWith('http')
        ? url
        : `https://${url}`
      if (! isURL(fullURL)) {
        this.setState({ urlError: `${url} is not a valid URL.` })
      } else {
        const version = await this.getPeriodOServerVersion(fullURL)
        if (version === null) {
          this.setState({
            urlError: `${url} is not a PeriodO data server or is not online.`,
          })
        } else {
          handleSave({
            ...this.state,
            url: fullURL,
          })
        }
      }
    } else {
      handleSave(this.state)
    }
  }

  render() {
    const { handleSave, handleDelete } = this.props
        , { label, description, url, type, fileError } = this.state

    return h(Box, [

      h(SelectBlock, {
        name: 'type',
        label: 'Type',
        helpText: 'Where the data is stored and whether it is editable',
        disabled: !!this.editing,
        value: type,
        onChange: this.handleChange,
        options:  [
          h('option', { value: 'IndexedDB' }, 'In-browser (editable)'),
          h('option', { value: 'Web' }, 'Web (read-only)'),
          h('option', { value: 'StaticFile' }, 'File (read-only)'),
        ],
      }),

      type === 'StaticFile' && h(InputBlock, {
        isRequired: true,
        mt: 3,
        name: 'file',
        label: 'File',
        helpText: 'A JSON file containing a valid PeriodO dataset',
        type: 'file',
        disabled: !!this.editing,
        onChange: this.handleFileChange,
        error: fileError,
      }),

      type === 'Web' && h(InputBlock, {
        isRequired: true,
        mt: 3,
        name: 'url',
        label: 'URL',
        helpText: 'URL of a PeriodO data server',
        disabled: !!this.editing,
        value: url || '',
        onChange: this.handleChange,
        error: this.props.urlError || this.state.urlError,
      }),

      h(InputBlock, {
        isRequired: true,
        mt: 3,
        name: 'label',
        label: 'Label',
        helpText: 'A unique name for this data source',
        value: label || '',
        onChange: this.handleChange,
      }),

      h(TextareaBlock, {
        mt: 3,
        name: 'description',
        label: 'Description',
        value: description || '',
        onChange: this.handleChange,
      }),

      h(Flex, {
        mt: 3,
        justifyContent: 'space-between',
      }, [
        h(Button$Primary, {
          onClick: this.isValidState()
            ? (() => this.checkValues(handleSave))
            : () => null,
          disabled: !this.isValidState(),
        }, this.editing ? 'Update' : 'Add'),

        this.editing && h(Button$Danger, {
          onClick: () => handleDelete(),
        }, 'Delete'),
      ]),
    ])
  }
}
