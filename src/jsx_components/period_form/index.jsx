"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , randomstr = require('../../utils/randomstr')
  , TemporalCoverageForm = require('./temporal_coverage_form.jsx')
  , LabelForm = require('./label_form.jsx')
  , SpatialCoverageForm = require('./spatial_coverage_form.jsx')

module.exports = React.createClass({
  displayName: 'PeriodForm',

  propTypes: {
    period: React.PropTypes.instanceOf(Immutable.Map).isRequired,
    source: React.PropTypes.instanceOf(Immutable.Map).isRequired,
    spatialCoverages: React.PropTypes.instanceOf(Immutable.List)
  },


  getDefaultProps() {
    return { spatialCoverages: Immutable.List() }
  },


  getInitialState() {
    return {
      period: this.props.period,
      errors: Immutable.Map()
    }
  },


  isValid() {
    var { validate } = require('../../helpers/period')
      , errors = validate(this.getPeriodValue()) || {}

    errors = Immutable.fromJS(errors);
    this.setState({ errors });

    return !errors.size;
  },


  getPeriodValue() {
    var period = this.state.period

    period = period
      .merge(this.refs.temporalCoverage.getValue())
      .merge(this.refs.spatialCoverage.getValue())
      .merge(this.refs.labelForm.getValue())
      .merge({ type: 'PeriodDefinition' })
      .filter(val => val instanceof Immutable.Iterable ? val.size : (val && val.length))

    if (!period.getIn(['source', 'locator'])) {
      period = period.delete('source');
    }

    return period;
  },


  handleChange(field, e) {
    var value = e.target.value;
    if (!Array.isArray(field)) field = [field];
    this.setState(prev => ({ period: prev.period.setIn(field, value) }));
  },


  handleLocatorChange(e) {
    var { isLinkedData } = require('../../helpers/source')
      , source = this.props.source
      , locator = e.target.value

    // Only set locator for periods whose sources are linked data.
    if (!source || !isLinkedData(source) || !source.get('id')) return;

    this.setState(prev => ({
      period: prev.period.set('source', Immutable.Map({
        partOf: source.get('id'),
        locator
      }))
    }));
  },


  render() {
    var Input = require('../shared/input.jsx')
      , randID = randomstr()
      , { errors } = this.state

    return (
      <div className="period-form-body">
        <div className="row">
          <div className="col-md-6 period-form-panel">
            {
              errors.has('label') && (
                <div className="alert alert-danger">
                  { errors.get('label').map(msg => <p>{ msg }</p>) }
                </div>
              )
            }
            <LabelForm
                ref="labelForm"
                period={this.state.period} />
          </div>
          <div className="col-md-6 period-form-panel">
            <Input
                name="locator"
                label="Locator"
                placeholder="Position within the source (e.g. page 75)"
                value={this.state.period.getIn(['source', 'locator'])}
                onChange={this.handleLocatorChange} />
            <Input
                name="url"
                label="URL"
                placeholder="URL for a webpage for this period"
                value={this.state.period.get('url')}
                onChange={this.handleChange.bind(null, 'url')} />
            <Input
                name="sameAs"
                label="Same as (not editable)"
                disabled={true}
                placeholder="Linked data for this period"
                value={this.state.period.get('sameAs')}
                onChange={() => null} />
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
            {
              errors.has('dates') && (
                <div className="alert alert-danger">
                  { errors.get('dates').map(msg => <p>{ msg }</p>) }
                </div>
              )
            }
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
              <label className="control-label" htmlFor={'note-' + randID}>Note</label>
              <p className="small">Notes derived from the source</p>
              <textarea
                  id={'note-' + randID}
                  className="form-control long"
                  value={this.state.period.get('note')}
                  onChange={this.handleChange.bind(null, 'note')}
                  rows="5" />
            </div>

            <div className="form-group col-md-6 period-form-panel">
              <label className="control-label" htmlFor={'editorial-note-' + randID}>
                Editorial note
              </label>
              <p className="small">Notes about the import process</p>
              <textarea
                  id={'editorial-note-' + randID}
                  className="form-control long"
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
