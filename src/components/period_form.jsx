"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , TerminusInput
  , LabelInput

const emptyTerminus = Immutable.fromJS({ label: '', in: { year: '' }})

TerminusInput = React.createClass({
  propTypes: {
    terminusType: React.PropTypes.oneOf(['start', 'stop']).isRequired,
  },

  getDefaultProps: function () {
    return { terminus: emptyTerminus }
  },

  getInitialState: function () {
    return {
      terminus: this.props.terminus
    }
  },

  isMultivalued: function () {
    return this.state.terminus.hasIn(['in', 'earliestYear']);
  },

  handleChangeLabel: function (e) {
    var parseDate = require('../utils/date_parser.js')
      , parsed = parseDate(e.target.value)

    if (parsed) {
      this.setState({ terminus: Immutable.fromJS(parsed).delete('_type') })
    } else {
      this.setState({ terminus: emptyTerminus })
    }
  },

  render: function () {
    var Input = require('./shared/input.jsx')

    return (
      <div className="row">
        <div className="col-md-12">
          <Input
              id={`js-${this.props.terminusType}Date`}
              name="label"
              label="Label"
              value={this.state.terminus.get('label')}
              onChange={this.props.autoparse ? this.handleChangeLabel : this.handleChange} />
        </div>

        <div>
          {this.isMultivalued() ?
            (
            <div>
              <div className="col-md-4">
                <Input
                    id={`js-${this.props.terminusType}-earliest-start`}
                    name="earliestStart"
                    label="Earliest start"
                    value={this.state.terminus.getIn(['in', 'earliestYear'])}
                    disabled={this.props.autoparse}
                    onChange={this.handleChange} />
              </div>
              <div className="col-md-4">
                <Input
                    id={`js-${this.props.terminusType}-latest-stop`}
                    name="latestStop"
                    label="Latest stop"
                    value={this.state.terminus.getIn(['in', 'latestYear'])}
                    disabled={this.props.autoparse}
                    onChange={this.handleChange} />
              </div>
            </div>
            )
              :
            (
            <div>
              <div className="col-md-4">
                <Input
                    id={`js-${this.props.terminusType}Year`}
                    name="year"
                    label="Year"
                    value={this.state.terminus.getIn(['in', 'year'])}
                    disabled={this.props.autoparse}
                    onChange={this.handleChange} />
              </div>
              <div className="col-md-4">
              </div>
            </div>
            )
          }
          <div className="col-md-4">
            <label> </label>
            <button className="btn btn-primary" disabled={this.props.autoparse}>
              Toggle earliest/latest
            </button>
          </div>
        </div>

      </div>
    )
  }
});

LabelInput = React.createClass({
  getDefaultProps: function () {
    return { code: 'eng-latn' }
  },
  render: function () {
    return (
      <div className="form-group" data-field="alternate-label">
        <div className="input-group">
          <div className="input-group-addon label-language btn btn-default">{this.props.code}</div>
          <input className="form-control" id={this.props.id} type="text" />
          {this.props.handleAddLabel ?
            (<span className="input-group-addon btn"><strong>+</strong></span>) : null}
          {this.props.handleRemoveLabel ?
            (<span className="input-group-addon btn"><strong>-</strong></span>) : null}
        </div>
      </div>
    )
  }
});

module.exports = React.createClass({
  getInitialState: function () {
    var { wasAutoparsed } = require('../helpers/terminus')

    return {
      parseDates: true,
      period: this.props.period
    }
  },
  toggleAutoparse: function () {
    this.setState(prev => ({ parseDates: !prev.parseDates }));
  },
  handleChange: function (e) {
    console.log(e);
  },
  render: function () {
    var Input = require('./shared/input.jsx')
      , { getOriginalLabel, getAlternateLabels } = require('../helpers/period.js')
      , alternateLabels = getAlternateLabels(this.props.period)

    if (!alternateLabels.size) {
      alternateLabels = Immutable.List(Immutable.Map({
        value: '',
        language: 'eng',
        script: 'latn'
      }));
    }

    return (
      <div className="period-form-body">
        <div className="row">
          <div className="col-md-6 period-form-panel">
            <label className="field-required-label" htmlFor="js-label">Label</label>
            <LabelInput
                id="js-label"
                label={getOriginalLabel(this.props.period)} />

            <label htmlFor="js-label">Alternate labels</label>
            {
              alternateLabels.map(label =>
                <LabelInput id="js-label"
                    label={label}
                    handleAddLabel={() => null}
                    handleRemoveLabel={() => null}/>
              )
            }
          </div>
          <div className="col-md-6 period-form-panel">
            <Input
                id="js-locator"
                name="locator"
                label="Locator"
                placeholder="Position within the source (e.g. page 75)"
                onChange={this.handleChange} />
            <Input
                id="js-same-as"
                name="sameAs"
                label="Same as"
                placeholder="URL for this period in an external linked dataset"
                onChange={this.handleChange} />
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="period-form-panel col-md-6">
            <h3>Spatial coverage</h3>
          </div>
          <div className="period-form-panel col-md-6">
            <h3>Temporal coverage</h3>

            <div>
              <label>
                <input
                    type="checkbox"
                    checked={this.state.parseDates}
                    onChange={this.toggleAutoparse} /> Parse dates automatically
              </label>
            </div>

            <h4>Start</h4>
            <TerminusInput
                terminus={this.state.period.get('start')}
                autoparse={this.state.parseDates}
                terminusType="start" />

            <h4>Stop</h4>
            <TerminusInput
                terminus={this.state.period.get('stop')}
                autoparse={this.state.parseDates}
                terminusType="stop" />
          </div>

        </div>

        <hr />

        <div>
          <h3>Notes</h3>
          <div className="row">
            <div className="form-group col-md-6 period-form-panel">
              <label className="control-label" htmlFor="js-note">Note</label>
              <p className="small">Notes derived from the source</p>
              <textarea className="form-control long" id="js-note" rows="5"></textarea>
            </div>

            <div className="form-group col-md-6 period-form-panel">
              <label className="control-label" htmlFor="js-editorial-note">
                Editorial note
              </label>
              <p className="small">Notes about the import process</p>
              <textarea className="form-control long" id="js-editorial-note" rows="5"></textarea>
            </div>
          </div>
        </div>
      </div>
    )
  }
});
