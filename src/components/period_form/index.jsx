"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , TemporalCoverageForm = require('./temporal_coverage_form.jsx')
  , LabelForm = require('./label_form.jsx')
  , SpatialCoverageForm = require('./spatial_coverage_form.jsx')

module.exports = React.createClass({
  displayName: 'PeriodForm',
  getInitialState: function () {
    return { period: this.props.period }
  },
  getPeriodValue: function () {
    var period = this.state.period

    period = period
      .merge(this.refs.temporalCoverage.getValue())
      .merge(this.refs.labelForm.getValue())
      .filter(val => val instanceof Immutable.Iterable ? val.size : (val && val.length))

    if (!period.getIn(['source', 'locator'])) {
      period = period.delete('source');
    }

    return period;
  },

  handleChange: function (field, e) {
    var value = e.target.value;
    if (!Array.isArray(field)) field = [field];
    this.setState(prev => ({ period: prev.period.setIn(field, value) }));
  },

  render: function () {
    var Input = require('../shared/input.jsx')

    return (
      <div className="period-form-body">
        <div className="row">
          <div className="col-md-6 period-form-panel">
            <LabelForm
                ref="labelForm"
                originalLabel={this.state.period.get('originalLabel')}
                alternateLabels={this.state.period.get('alternateLabel')} />
          </div>
          <div className="col-md-6 period-form-panel">
            <Input
                id="js-locator"
                name="locator"
                label="Locator"
                placeholder="Position within the source (e.g. page 75)"
                value={this.state.period.getIn(['source', 'locator'])}
                onChange={this.handleChange.bind(null, ['source', 'locator'])} />
            <Input
                id="js-same-as"
                name="sameAs"
                label="Same as"
                placeholder="URL for this period in an external linked dataset"
                value={this.state.period.get('sameAs')}
                onChange={this.handleChange.bind(null, 'sameAs')} />
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="period-form-panel col-md-6">
            <h3>Spatial coverage</h3>
            <SpatialCoverageForm
                ref="spatialCoverage"
                description={this.state.period.get('spatialCoverageDescription')}
                coverage={this.state.period.get('spatialCoverage')}
                coverageDescriptionSet={this.props.spatialCoverages} />
          </div>
          <div className="period-form-panel col-md-6">
            <TemporalCoverageForm
                start={this.state.period.get('start')}
                stop={this.state.period.get('stop')}
                ref="temporalCoverage" />
          </div>
        </div>

        <hr />

        <div>
          <h3>Notes</h3>
          <div className="row">
            <div className="form-group col-md-6 period-form-panel">
              <label className="control-label" htmlFor="js-note">Note</label>
              <p className="small">Notes derived from the source</p>
              <textarea
                  className="form-control long"
                  id="js-note"
                  value={this.state.period.get('note')}
                  onChange={this.handleChange.bind(null, 'note')}
                  rows="5" />
            </div>

            <div className="form-group col-md-6 period-form-panel">
              <label className="control-label" htmlFor="js-editorial-note">
                Editorial note
              </label>
              <p className="small">Notes about the import process</p>
              <textarea
                  className="form-control long"
                  id="js-editorial-note"
                  value={this.state.period.get('editorialNote')}
                  onChange={this.handleChange.bind(null, 'editorialNote')}
                  rows="5" />
            </div>
          </div>
        </div>
      </div>
    )
  }
});
