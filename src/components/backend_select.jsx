"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , BackendForm

const BACKEND_NAMES = {
  web: 'Web',
  idb: 'IndexedDB',
  file: 'File',
  memory: 'In-memory'
}

BackendForm = React.createClass({

  getInitialState() {
    return { type: 'idb' }
  },

  handleChange(e) {
    if (e.target.name === 'type') {
      this.replaceState({ type: e.target.value });
    } else {
      this.setState({ [e.target.name]: e.target.value });
    }
  },

  handleSave() {
    require('../backends')
      .create(this.state)
      .then(() => window.location.reload())
  },


  handleFileChange(e) {
    var parsePeriodoUpload = require('../utils/parse_periodo_upload')
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
    var isValid = (
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
    var Input = require('./shared/input.jsx')

    var webSource = this.state.type === 'web' && (
      <Input
          id="js-web-source"
          name="url"
          label="Source"
          value={this.state.source}
          onChange={this.handleChange} />
    )

    var fileSource = this.state.type === 'file' && (
      <div>
        <label>
          Input file
          <input type="file" onChange={this.handleFileChange} />
        </label>
      </div>
    )

    return (
      <div className="row">
        <div className="col-md-4">
          <h2>Add backend</h2>

          <div className="form-group">
            <label htmlFor="js-backend-type">Type</label>
            <select
                name="type"
                value={this.state.type}
                onChange={this.handleChange}
                id="js-backend-type"
                className="form-control">
              <option value="idb">IndexedDB (editable, stored locally)</option>
              <option value="web">Web (read-only, accessed remotely)</option>
              <option value="file">File (read-only, stored locally)</option>
            </select>
          </div>

          <div className="form-group">
            <Input
                id="js-name"
                name="name"
                label="Name"
                value={this.state.name}
                disabled={this.state.type === 'file'}
                onChange={this.handleChange} />
            { webSource }
            { fileSource }
          </div>

          <div>
            <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleSave}
                disabled={!this.isValidState()}>Add</button>
          </div>
        </div>
      </div>
    )
  }
});

module.exports = React.createClass({
  displayName: 'BackendSelect',

  handleDownloadBackend(backendMap) {
    var saveAs = require('filesaver.js')
      , stringify = require('json-stable-stringify')

    require('../backends').get(backendMap.get('name'))
      .then(backend => backend.fetchData())
      .then(({ data, modified }) => {
        var filename = `periodo-${backendMap.get('name')}-${modified}.json`
          , blob

        data['@context'] = require('../context.json');

        blob = new Blob(
          [stringify(JSON.parse(JSON.stringify(data)), { space: '  ' })],
          { type: 'application/ld+json' }
        )

        saveAs(blob, filename);
      })
  },

  handleDeleteBackend(backend) {
    var { destroy } = require('../backends')
      , sure = confirm(`Delete backend ${backend.get('name')}?`)

    if (sure) {
      destroy(backend.get('name'))
        .then(() => window.location.reload())
    }
  },

  render() {
    var sortedBackends = Immutable.fromJS(this.props.backends)

    sortedBackends = sortedBackends
      .toOrderedMap()
      .sort((a, b) => b.name === 'Canonical' ? 0 : 1)
      .valueSeq()

    return (
      <div>
        <h2>Select backends</h2>
        <p>Select a backend to use.</p>

        <div className="row">
          <div className="col-md-6">
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ textAlign: 'center' }}>Type</th>
                  <th style={{ textAlign: 'center' }}>Download</th>
                  <th style={{ textAlign: 'center' }}>Delete</th>
                </tr>
              </thead>

              <tbody>
                {sortedBackends.map(backend => (
                  <tr key={backend.get('name')}>
                    <td style={{ width: '100%' }}>
                      <a href={'#p/' + backend.get('name') + '/'}>
                        { backend.get('name') }
                      </a>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      { BACKEND_NAMES[backend.get('type')] }
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <a href="" onClick={this.handleDownloadBackend.bind(null, backend)}>
                        <img style={{
                          height: '22px',
                          width: '80px',
                          marginLeft: '6px'
                        }} src="lib/noun_433_cc.svg" />
                      </a>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {
                        backend.get('name') === 'Canonical' ? '' :
                          <a href="" onClick={this.handleDeleteBackend.bind(null, backend)}>
                            <img style={{
                              height: '22px',
                              width: '80px',
                              marginLeft: '6px'
                            }} src="lib/noun_304_cc.svg" />
                          </a>
                      }
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <BackendForm existing={Object.keys(this.props.backends)} />
      </div>
    )
  }
});
