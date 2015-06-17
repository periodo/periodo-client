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

var LanguageSelectDropdown = React.createClass({
  displayName: 'LanguageSelectDropdown',
  handleSelect: function (language) {
    this.props.onChange(language);
  },
  getMatchingLanguages: function (text) {
    var languages = require('../utils/languages')

    if (text) {
      let matchingSet = Immutable.Set(text);
      languages = languages
        .filter(lang => matchingSet.subtract(Immutable.Set(lang.get('name'))).size === 0)
    } else {
      languages = languages
        .filter(lang => lang.get('iso6391'))
        .sortBy(lang => lang.get('name'))
    }

    return languages.take(10);
  },
  render: function () {
    var DropdownAutocomplete = require('./shared/dropdown_autocomplete.jsx')

    return <DropdownAutocomplete
      label={this.props.language}
      getMatchingItems={this.getMatchingLanguages}
      renderMatch={lang => lang.get('name')}
      onSelect={this.handleSelect} />
  }
});

var ScriptSelectDropdown = React.createClass({
  displayName: 'ScriptSelectDropdown',
  handleSelect: function (script) {
    this.props.onChange(script);
  },
  getMatchingScripts: function (text) {
    var scripts = require('../utils/scripts');
    if (text) {
      let matchingSet = Immutable.Set(text);
      scripts = scripts
        .filter(script => matchingSet.subtract(Immutable.Set(script.get('name'))).size === 0)
    }

    return scripts.take(10);
  },
  render: function () {
    var DropdownAutocomplete = require('./shared/dropdown_autocomplete.jsx')

    return <DropdownAutocomplete
      label={this.props.script}
      getMatchingItems={this.getMatchingScripts}
      renderMatch={script => script.get('name')}
      onSelect={this.handleSelect} />
  }
});

LabelInput = React.createClass({
  handleSelect: function (field, value) {
    var newLabel = this.props.label.set(field, value.get('code').toLowerCase());
    this.props.onChange(newLabel);
  },
  handleChange: function (field, e) {
    var newLabel = this.props.label.set(field, e.target.value);
    this.props.onChange(newLabel);
  },
  render: function () {
    return (
      <div className="form-group" data-field="alternate-label">
        <div className="input-group">

          <div className="input-group-btn">
            <LanguageSelectDropdown
                onChange={this.handleSelect.bind(null, 'language')}
                language={this.props.label.get('language')} />
            <ScriptSelectDropdown
                onChange={this.handleSelect.bind(null, 'script')}
                script={this.props.label.get('script')} />
          </div>

          <input
              className="form-control"
              id={this.props.id}
              value={this.props.label.get('value')}
              onChange={this.handleChange.bind(null, 'value')}
              type="text" />
          {
            !this.props.handleAddLabel ? null :
              <span className="input-group-addon btn" onClick={this.props.handleAddLabel}>
                <strong>+</strong>
              </span>
          }
          {
            !this.props.handleRemoveLabel ? null :
              <span className="input-group-addon btn" onClick={this.props.handleRemoveLabel}>
                <strong>-</strong>
              </span>
          }
        </div>
      </div>
    )
  }
});

module.exports = React.createClass({
  getInitialState: function () {
    var { wasAutoparsed } = require('../helpers/terminus')
      , { getAlternateLabels } = require('../helpers/period.js')
      , alternateLabels
      , parseDates

    alternateLabels = getAlternateLabels(this.props.period);
    if (!alternateLabels.size) {
      alternateLabels = Immutable.List.of(Immutable.Map({
        value: '',
        language: 'eng',
        script: 'latn'
      }));
    }

    if (!(this.props.period.get('start') && this.props.period.get('stop'))) {
      parseDates = true;
    } else {
      parseDates = (
        wasAutoparsed(this.props.period.get('start')) &&
        wasAutoparsed(this.props.period.get('stop'))
      )
    }

    return {
      period: this.props.period,
      parseDates,
      alternateLabels
    }
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
  toggleAutoparse: function () {
    this.setState(prev => ({ parseDates: !prev.parseDates }));
  },
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
    var Input = require('./shared/input.jsx')
      , { getOriginalLabel } = require('../helpers/period.js')

    return (
      <div className="period-form-body">
        <div className="row">
          <div className="col-md-6 period-form-panel">
            <label className="field-required-label" htmlFor="js-label">Label</label>
            <LabelInput
                id="js-label"
                label={getOriginalLabel(this.state.period)}
                onChange={this.handleLabelChange} />

            <label htmlFor="js-label">Alternate labels</label>
            {
              this.state.alternateLabels.map((label, i) =>
                <LabelInput id="js-label"
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
