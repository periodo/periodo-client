"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , skolemID = require('../utils/generate_skolem_id.js')
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
  displayName: 'PeriodCollectionShow',
  getInitialState: function () {
    return {
      editingPeriod: null,
      view: 'list'
    }
  },
  componentWillReceiveProps: function (nextProps) {
    if (this.props.store && !this.props.store.equals(nextProps.store)) {
      this.setState({ editingPeriod: null });
    }
  },
  handlePeriodEdit: function (period) {
    this.setState({ editingPeriod: period.deref() });
  },
  handlePeriodAdd: function () {
    this.setState({ editingPeriod: Immutable.Map({}) })
  },
  handleSave: function () {
    var period = this.refs.editForm.getPeriodValue()
      , save

    if (!period.has('id')) {
      period = period.set('id', skolemID());
      save = true;
    } else {
      save = !period.equals(this.props.cursor.getIn(['definitions', period.get('id')]));
    }

    if (this.refs.editForm.isValid()) {
      if (save) {
        this.props.cursor.setIn(['definitions', period.get('id')], period);
      } else {
        this.setState({ editingPeriod: null });
      }
    }
  },
  handleCancel: function () {
    this.setState({ editingPeriod: null });
  },
  handleDelete: function () {
    var period = this.state.editingPeriod

    if (confirm(`Delete period "${period.get('label')}"?`)) {
      this.props.cursor.deleteIn(['definitions', period.get('id')]);
    }
  },
  renderShownPeriod: function (period) {
    return (
      <PeriodDetails
          period={period}
          showEditButton={this.props.backend.editable && !this.state.editingPeriod}
          onPeriodEdit={this.handlePeriodEdit} />
    )
  },
  render: function () {
    var url = require('url')
      , PeriodList = require('./faceted_browser/period_list.jsx')
      , PeriodForm = require('./period_form')
      , PreformattedFile = require('./shared/pre_file.jsx')
      , Source = require('./shared/source.jsx')
      , { getDisplayTitle } = require('../helpers/source')
      , { getSpatialCoverages } = require('../helpers/periodization_collection.js')
      , { asJSONLD, asTurtle, asCSV } = require('../helpers/periodization')
      , initiallyShownPeriodID

    initiallyShownPeriodID = url.parse(window.location.hash.slice(1), true).query.show_period

    return (
      <div>
        <h2>{getDisplayTitle(this.props.cursor.get('source'))}</h2>
        {
          this.state.editingPeriod && (
            <div className="period-form">
              <div className="period-form-header">
                <h3>
                {
                  this.state.editingPeriod.has('id') ?
                    'Editing period: ' + this.state.editingPeriod.get('label') :
                    'Add period'
                }
                </h3>
              </div>
              <PeriodForm
                  period={this.state.editingPeriod}
                  source={this.props.cursor.get('source')}
                  spatialCoverages={getSpatialCoverages(this.props.store.get('periodCollections'))}
                  ref="editForm" />
              <div className="period-form-footer">
                <button
                    className="btn btn-primary"
                    onClick={this.handleSave}>
                  Save
                </button>

                <button
                    className="btn btn-default pull-right"
                    onClick={this.handleCancel}>
                  Cancel
                </button>

                {
                  this.state.editingPeriod.has('id') && (
                    <button
                        style={{ marginRight: '8px' }}
                        className="btn btn-danger pull-right"
                        onClick={this.handleDelete}>
                      Delete
                    </button>
                  )
                }
              </div>
            </div>
          )
        }

        {
          !this.state.editingPeriod && <Source data={this.props.cursor.get('source')} />
        }

        {
          (this.props.backend.editable && !this.state.editingPeriod) && (
            <div>
              <br />
              <br />
              <a href={window.location.href + 'edit/'}
                 className="btn btn-lg btn-primary">
                Edit collection details
              </a>
              {' '}
              <button className="btn btn-lg btn-primary" onClick={this.handlePeriodAdd}>
                Add period
              </button>
              <br />
              <br />
            </div>
          )
        }

        {
          this.props.cursor.has('editorialNote') && (
            <div>
              <h3>Editorial note</h3>
              <p>{ this.props.cursor.get('editorialNote') }</p>
            </div>
          )
        }

        {
          !this.state.editingPeriod && (
            <ul className="nav nav-tabs" style={{ marginBottom: '1.5em' }}>
              <li className={this.state.view === 'list' ? 'active' : ''}>
                <a href="" onClick={() => this.setState({ view: 'list' })}>Period list</a>
              </li>
              <li className={this.state.view === 'jsonld' ? 'active' : ''}>
                <a href="" onClick={() => this.setState({ view: 'jsonld' })}>JSON-LD</a>
              </li>
              <li className={this.state.view === 'ttl' ? 'active' : ''}>
                <a href="" onClick={() => this.setState({ view: 'ttl' })}>Turtle</a>
              </li>
              <li className={this.state.view === 'csv' ? 'active' : ''}>
                <a href="" onClick={() => this.setState({ view: 'csv' })}>CSV</a>
              </li>
            </ul>
          )
        }

        {
          (this.state.view === 'list' || this.state.editingPeriod) && (
            this.props.cursor.get('definitions').size === 0 ?
              <p>No periods defined for collection.</p> :
              <PeriodList
                  initiallyShownPeriodID={initiallyShownPeriodID}
                  renderShownPeriod={this.renderShownPeriod}
                  periods={this.props.cursor.get('definitions').toList()} />
          )
        }

        {
          (this.state.view === 'jsonld' && !this.state.editingPeriods) && (
            <PreformattedFile
                filename={this.props.cursor.get('id') + '.jsonld'}
                mimetype='application/ld+json'
                getFileContent={() => JSON.stringify(asJSONLD(this.props.cursor), true, '  ')} />
          )
        }

        {
          (this.state.view === 'ttl' && !this.state.editingPeriods) && (
            <PreformattedFile
                filename={this.props.cursor.get('id') + '.ttl'}
                mimetype='text/turtle'
                getFileContent={() => asTurtle(this.props.cursor, true)} />
          )
        }

        {
          (this.state.view === 'csv' && !this.state.editingPeriods) && (
            <PreformattedFile
                filename={this.props.cursor.get('id') + '.csv'}
                mimetype='text/csv'
                getFileContent={() => asCSV(this.props.cursor)} />
          )
        }
      </div>
    )
  }
});
