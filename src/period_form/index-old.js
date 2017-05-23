"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , randomstr = require('../../utils/randomstr')
    , TemporalCoverageForm = require('./temporal_coverage_form')
    , LabelForm = require('./label_form')
    , SpatialCoverageForm = require('./spatial_coverage_form')
    , { validate } = require('../../utils/period')
    , { InputBlock, ErrorAlert } = require('../shared/components')
    , { Block } = require('axs')
    , { Flex } = require('axs-ui')

module.exports = class PeriodForm extends React.Component {
  constuctor() {
    super();

    this.state = {
      period: this.props.period.set({ type: 'PeriodDefinition' }),
      errors: Immutable.Map()
    }

    this.renderError = this.renderError.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);
    this.refreshValidation = this.refreshValidation.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    // Trigger a validation once
    if (nextProps.validate && !this.props.validate) {
      this.setState({
        errors: validate(this.getPeriodValue())
      })
    }
  }

  getPeriodValue() {
    let period = this.state.period

    period = period
      .merge(this.refs.temporalCoverage.getValue())
      .merge(this.refs.spatialCoverage.getValue())
      .merge(this.refs.labelForm.getValue())
      .merge({ type: 'PeriodDefinition' })
      .filter(val => val instanceof Immutable.Iterable ? val.size : (val && val.length))

    // TODO: Not sure what this was supposed to do, but I think it should be
    // taken care of elsewhere
    if (!period.getIn(['source', 'locator'])) {
      period = period.delete('source');
    }

    return period;
  }

  handleChange(field, e) {
    const { value }  = e.target

    if (!Array.isArray(field)) field = [field];

    this.setState(prev => ({ period: prev.period.setIn(field, value) }));
  }

  handleValueChange(value) {
    this.setState(prev => ({ period: prev.period.merge(value) }));
  }

  handleLocatorChange(e) {
    const { isLinkedData } = require('../../utils/source')
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
  }

  renderError(label) {
    const { errors } = this.props

    return errors.has(label) && (
      h(ErrorAlert, { display: errors.get(label) })
    )
  }

  render() {
    const randID = randomstr()
        , { spatialCoverages } = this.props
        , { period } = this.state

    return (
      h('div', [
        h(Flex, { flexWrap: 'wrap' }, [
          h(Block, { width: 1 }, [
            this.renderError('label'),
            h(LabelForm, {
              period,
              onValueChange: this.handleValueChange
            })
          ]),

          h(Block, { width: 1 }, [
            h(InputBlock, {
              name: 'locator',
              label: 'Locator',
              placeholder: 'Position within the source (e.g. page 75)',
              value: period.getIn(['source', 'locator']),
              onChange: this.handleLocatorChange,
            }),

            h(InputBlock, {
              name: 'url',
              label: 'URL',
              placeholder: 'URL for a webpage for this period',
              value: period.get('url'),
              onChange: this.handleChange.bind(this, 'url'),
            }),

            h(InputBlock, {
              name: 'sameAs',
              label: 'Same as (not editable)',
              disabled: true,
              placeholder: 'Linked data for this period',
              value: period.get('sameAs'),
              onChange: () => null,
            })
          ]),
        ]),

        h('hr'),

        h(Flex, { flexWrap: 'wrap' }, [
          h(Block, { width: 1 }, [
            h('h3', 'Spatial coverage'),
            h(SpatialCoverageForm, {
              onValueChange: this.handleValueChange,
              description: period.get('spatialCoverageDescription'),
              coverage: period.get('spatialCoverage'),
              coverageDescriptionSet: spatialCoverages
            })
          ]),

          h(Block, { width: 1 }, [
            this.renderError('dates'),
            h(TemporalCoverageForm, {
              onValueChange: this.handleValueChange,
              start: period.get('start'),
              stop: period.get('stop'),
            })
          ])
        ])
      ]),

      h('hr'),

      h(Flex, { flexWrap: 'wrap' }, [
        h('h3', 'Notes'),
        h(Block, { width: 1 }, [
          h('label', { htmlFor: `note-${randID}` }, 'Note'),
          h('p', 'Notes derived from the source'),
          h('textarea', {
            id: `note-${randID}`,
            value: period.get('note'),
            onChange: this.handleChange.bind(this, 'note'),
            rows: 5
          })
        ]),

        h(Block, { width: 1 }, [
          h('label', { htmlFor: `editorial-note-${randID}` }, 'Editorial note'),
          h('p', 'Notes derived from the source'),
          h('textarea', {
            id: `editorial-note-${randID}`,
            value: period.get('editorialNote'),
            onChange: this.handleChange.bind(this, 'editorialNote'),
            rows: 5
          })
        ])
      ])
    )
  }
}
