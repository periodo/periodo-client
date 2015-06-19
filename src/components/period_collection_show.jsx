"use strict";

var React = require('react')
  , PeriodDetails

PeriodDetails = React.createClass({
  handleClick: function () {
    this.props.onPeriodEdit(this.props.period);
  },
  render: function () {
    var Period = require('./shared/period.jsx')

    return (
      <div>
        <h4>{this.props.period.get('label')}</h4>
        <div className="row">
          <div className="col-md-6">
            <Period period={this.props.period} />
          </div>
          <div className="col-md-6">
            {
              !this.props.showEditButton ? '' :
              <button onClick={this.handleClick} className="btn btn-primary">Edit</button>
            }
          </div>
        </div>
      </div>
    )
  }
});

module.exports = React.createClass({
  getInitialState: function () {
    return { editingPeriod: null }
  },
  handlePeriodEdit: function (period) {
    // TODO: should be a read/write cursor, not just the period itself
    this.setState({ editingPeriod: period });
  },
  handleSave: function () {
    var period = this.refs.editForm.getPeriodValue()
  },
  renderShownPeriod: function (period) {
    return (
      <PeriodDetails
          period={period}
          showEditButton={!this.state.editingPeriod}
          onPeriodEdit={this.handlePeriodEdit} />
    )
  },
  render: function () {
    var PeriodList = require('../views/faceted_browser/period_list.jsx')
      , PeriodForm = require('./period_form')
      , { getDisplayTitle } = require('../helpers/source')
      , { getSpatialCoverages } = require('../helpers/periodization_collection.js')

    return (
      <div>
        <h2>{getDisplayTitle(this.props.collection.get('source'))}</h2>
        {
          !this.state.editingPeriod ? '' :
            <div className="period-form">
              <div className="period-form-header">
              DOIN SOMETHIN
              </div>
              <PeriodForm
                  period={this.state.editingPeriod}
                  spatialCoverages={getSpatialCoverages(this.props.store.get('periodCollections'))}
                  ref="editForm" />
              <div className="period-form-footer">
                <button
                    className="btn btn-primary"
                    onClick={this.handleSave}>
                  Save
                </button>
              </div>
            </div>
        }

        <PeriodList
            renderShownPeriod={this.renderShownPeriod}
            periods={this.props.collection.get('definitions')} />
      </div>
    )
  }
});
