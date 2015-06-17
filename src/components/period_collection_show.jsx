"use strict";

var React = require('react')
  , PeriodDetails
  , PeriodEditModal

PeriodDetails = React.createClass({
  handleClick: function (e) {
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
      , PeriodForm = require('./period_form.jsx')
      , { getDisplayTitle } = require('../helpers/source')

    return (
      <div>
        <h2>{getDisplayTitle(this.props.collection.get('source'))}</h2>
        {
          !this.state.editingPeriod ? '' :
            <div className="period-form">
              <div className="period-form-header">
              DOIN SOMETHIN
              </div>
              <PeriodForm period={this.state.editingPeriod} />
              <div className="period-form-footer">
              MAKE SOME ACTIONS
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
