const React = require('react')
    , h = require('react-hyperscript')
    , types = require('../../../types')


const {
  INDEXED_DB,
  FILE,
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

  handleSave() {
    /*
    require('../backends')
      .create(this.state)
      .then(() => window.location.reload())
      */
  },


  handleFileChange(e) {
    const parsePeriodoUpload = require('../../../utils/parse_periodo_upload')
        , file = e.target.files[0]

    parsePeriodoUpload(file)
      .then(
        data => this.setState({ name: file.name, data }),
        err => {
          this.setState({ name: null });
          alert('Error parsing file:\n' + err.toString());
          throw new Error(err);
        }
      );
  },


  isValidState() {
    let isValid = (
      !!this.state.type &&
      !!this.state.name &&
      this.props.existing.indexOf(this.state.name) === -1
    )

    if (this.state.type === 'web' || this.state.type === 'idb') {
      isValid = isValid && /^\w+$/.test(this.state.name);
    }

    if (this.state.type === 'web') {
      isValid = isValid && !!this.state.url;
    }

    return isValid;
  },

  render() {
    const Input = require('../../common/Input')

    return (
      h('div', [
        h('h2', 'Add backend'),

        h('div', [
          h('label', { htmlFor: 'type' }, 'Type'),

          h('select', {
            name: 'type',
            value: this.state.type,
            onChange: this.handleChange,
          }, [
            h('option', { value: INDEXED_DB }, 'Local'),
            h('option', { value: WEB }, 'Web resource'),
            h('option', { value: FILE }, 'File'),
          ])
        ]),

        h('div', [
          h(Input, {
            name: 'name',
            label: 'Name',
            value: this.state.name,
            disabled: this.state.type === FILE,
            onChange: this.handleChange
          }),

          this.state.type === WEB && h(Input, {
            name: 'url',
            label: 'URL',
            value: this.state.url,
            onChange: this.handleChange
          }),

          this.state.type === FILE && h('div', [
            h('label', [
              'Input file',
              h('input', { type: 'file', onChange: this.handleFileChange })
            ])
          ])
        ]),

        h('div', [
          h('button .btn .btn-primary', {
            type: 'button',
            onClick: this.handleSave,
            disabled: !this.isValidState()
          }, 'Add')
        ])
      ])
    )
  }
});
