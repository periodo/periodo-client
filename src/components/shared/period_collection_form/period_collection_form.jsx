"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , Errors

Errors = React.createClass({
  render: function () {
    return <div />
  }
});

module.exports = React.createClass({
  getInitialState: function () {
    return {
      linkedData: true,
      sourceData: null,
      editorialNote: '',
      errors: []
    }
  },
  toggleFormType: function () {
    this.setState({
      linkedData: !this.state.linkedData,
      sourceData: null,
      errors: []
    });
  },
  getValue: function () {
    var value = Immutable.Map({
      type: 'PeriodCollection',
      source: this.state.sourceData,
      definitions: Immutable.Map()
    });

    if (this.state.editorialNote) {
      value = value.set('editorialNote', this.state.editorialNote);
    }

    return value;
  },
  handleEditorialNoteChange: function (e) {
    var editorialNote = e.target.value;
    this.setState({ editorialNote });
  },
  handleSourceChange: function (source) {
    this.setState({ sourceData: source });
  },
  render: function () {
    var LDSourceForm = require('./ld_source_form.jsx')
      , NonLDSourceForm = require('./non_ld_source_form.jsx')

    var sourceForm = this.state.linkedData ?
      <LDSourceForm onSourceChange={this.handleSourceChange} data={this.state.sourceData} /> :
      <NonLDSourceForm onSourceChange={this.handleSourceChange} data={this.state.sourceData} />

    return (
      <div>
        <Errors errors={this.state.errors}/>

        <div className="row">
          <div className="col-md-6">
            <h2>Source</h2>
            {sourceForm}
          </div>
          <div className="col-md-6">
            <button
                onClick={this.toggleFormType}
                className="btn btn-default btn-lg toggle-form-type">
              My source is {this.state.linkedData ? <strong>not</strong> : ''} linked data ›
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <h2>About</h2>
            <div className="form-group">
              <label className="control-label" htmlFor="js-editorial-note">
                Editorial notes
              </label>
              <p className="small">Notes about importing this source</p>
              <textarea
                  className="form-control"
                  id="js-editorial-note"
                  onChange={this.handleEditorialNoteChange}
                  value={this.state.editorialNote}
                  rows={5} />
            </div>
          </div>
        </div>

      </div>
    )
  }
});
