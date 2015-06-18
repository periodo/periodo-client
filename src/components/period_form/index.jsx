"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , TemporalCoverageForm = require('./temporal_coverage_form.jsx')
  , LocalizedLabelInput = require('./localized_label_input.jsx')
  , SpatialCoverageForm = require('./spatial_coverage_form.jsx')

module.exports = React.createClass({
  getInitialState: function () {
    var { getAlternateLabels } = require('../../helpers/period.js')
      , alternateLabels

    alternateLabels = getAlternateLabels(this.props.period);
    if (!alternateLabels.size) {
      alternateLabels = Immutable.List.of(Immutable.Map({
        value: '',
        language: 'eng',
        script: 'latn'
      }));
    }

    return { period: this.props.period, alternateLabels }
  },
  getPeriodValue: function () {
    var period = this.state.period
      , alternateLabels

    alternateLabels = this.state.alternateLabels
      .groupBy(label => `${label.get('language')}-${label.get('script')}`)
      .toMap()
      .map(labels => labels.map(label => label.get('value')))

    if (alternateLabels.size) {
      period = period.set('alternateLabel', alternateLabels)
    }

    period = period
      .filter(val => val instanceof Immutable.Iterable ? val.size : (val && val.length))

    if (!period.getIn(['source', 'locator'])) {
      period = period.delete('source');
    }

    return period;
  },

  /* *
   * Change handlers for the various form components
   * */

  handleChange: function (field, e) {
    var value = e.target.value;
    if (!Array.isArray(field)) field = [field];
    this.setState(prev => ({ period: prev.period.setIn(field, value) }));
  },

  handleLabelChange: function (label) {
    this.setState(prev => {
      var period = prev.period;

      period = period
        .set('label', label.get('value'))
        .set('originalLabel', Immutable.Map({
          [label.get('language') + '-' + label.get('script')]: label.get('value')
        }))

      return { period }
    });
  },

  handleAlternateLabelChange: function (idx, label) {
    var prevAltLabels = this.state.alternateLabels;
    this.setState({ alternateLabels: prevAltLabels.set(idx, label) });
  },

  addAlternateLabel: function (i) {
    if (!this.state.alternateLabels.getIn([i, 'value'])) {
      return
    } else {
      this.setState(prev => {
        var after = prev.alternateLabels.get(i)
          , alternateLabels = prev.alternateLabels

        alternateLabels = alternateLabels.splice(i + 1, 0, after.set('value', ''));

        return { alternateLabels }
      });
    }
  },

  removeAlternateLabel: function (i) {
    var prevAltLabels = this.state.alternateLabels

    if (prevAltLabels.size === 1) {
      this.setState({
        alternateLabels: prevAltLabels.setIn([0, 'value'], '')
      });
    } else {
      this.setState({
        alternateLabels: prevAltLabels.splice(i, 1)
      });
    }
  },

  render: function () {
    var Input = require('../shared/input.jsx')
      , { getOriginalLabel } = require('../../helpers/period.js')

    return (
      <div className="period-form-body">
        <div className="row">
          <div className="col-md-6 period-form-panel">
            <label className="field-required-label" htmlFor="js-label">Label</label>
            <LocalizedLabelInput
                id="js-label"
                label={getOriginalLabel(this.state.period)}
                onChange={this.handleLabelChange} />

            <label htmlFor="js-label">Alternate labels</label>
            {
              this.state.alternateLabels.map((label, i) =>
                <LocalizedLabelInput id="js-label"
                    key={i}
                    label={label}
                    onChange={this.handleAlternateLabelChange.bind(null, i)}
                    handleAddLabel={this.addAlternateLabel.bind(null, i)}
                    handleRemoveLabel={this.removeAlternateLabel.bind(null, i)} />
              )
            }
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
            <SpatialCoverageForm />
          </div>
          <div className="period-form-panel col-md-6">
            <TemporalCoverageForm
                start={this.state.period.get('start')}
                stop={this.state.period.get('stop')}
                ref="temporal-coverage" />
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
