"use strict";

var React = require('react')
  , Immutable = require('immutable')

const EMPTY_TERMINUS = Immutable.fromJS({ label: '', in: { year: '' }})

function parse(label) {
  var parseDate = require('../../utils/date_parser.js')
    , parsed = parseDate(label)
    , terminus

  terminus = parsed ?
    Immutable.fromJS(parsed).delete('_type') :
    EMPTY_TERMINUS.set('label', label)

  return terminus;
}

module.exports = React.createClass({
  displayName: 'TerminusInput',

  propTypes: {
    terminusType: React.PropTypes.oneOf(['start', 'stop']).isRequired,
  },

  getDefaultProps: function () {
    return { terminus: EMPTY_TERMINUS }
  },

  isMultivalued: function () {
    return this.props.terminus.hasIn(['in', 'earliestYear']);
  },

  toggleMultiValue: function () {
    let terminus = this.props.terminus
    if (this.isMultivalued()) {
      let earliest = terminus.getIn(['in', 'earliestYear']);
      this.props.onChange(terminus
        .deleteIn(['in', 'earliestYear'])
        .deleteIn(['in', 'latestYear'])
        .setIn(['in', 'year'], earliest || ''));
    } else {
      let year = terminus.getIn(['in', 'year']);
      this.props.onChange(terminus
        .deleteIn(['in', 'year'])
        .setIn(['in', 'earliestYear'], year || '')
        .setIn(['in', 'latestYear'], ''));
    }
  },

  handleChangeAutoparsedLabel: function (e) {
    var terminus = parse(e.target.value);
    this.props.onChange(terminus);
  },

  refreshAutoparse: function () {
    var terminus = parse(this.props.terminus.get('label'));
    this.props.onChange(terminus);
  },

  handleChange: function (field, e) {
    var value = e.target.value;
    this.props.onChange(this.props.terminus.setIn([].concat(field), value));
  },

  render: function () {
    var Input = require('../shared/input.jsx')

    return (
      <div className="row">
        <div className="col-md-12">
          <Input
              name="label"
              label="Label"
              value={this.props.terminus.get('label')}
              onChange={this.props.autoparse ?
                this.handleChangeAutoparsedLabel :
                this.handleChange.bind(null, 'label')} />
        </div>

        <div>
          {this.isMultivalued() ?
            (
            <div>
              <div className="col-md-4">
                <Input
                    name="earliestStart"
                    label="Earliest start"
                    value={this.props.terminus.getIn(['in', 'earliestYear'])}
                    disabled={this.props.autoparse}
                    onChange={this.handleChange.bind(null, ['in', 'earliestYear'])} />
              </div>
              <div className="col-md-4">
                <Input
                    name="latestStop"
                    label="Latest stop"
                    value={this.props.terminus.getIn(['in', 'latestYear'])}
                    disabled={this.props.autoparse}
                    onChange={this.handleChange.bind(null, ['in', 'latestYear'])} />
              </div>
            </div>
            )
              :
            (
            <div>
              <div className="col-md-4">
                <Input
                    name="year"
                    label="Year"
                    value={this.props.terminus.getIn(['in', 'year'])}
                    disabled={this.props.autoparse}
                    onChange={this.handleChange.bind(null, ['in', 'year'])} />
              </div>
              <div className="col-md-4" />
            </div>
            )
          }
          <div className="col-md-4">
            <label> </label>
            <button
                className="btn btn-primary"
                disabled={this.props.autoparse}
                onClick={this.toggleMultiValue} >
              Toggle earliest/latest
            </button>
          </div>
        </div>

      </div>
    )
  }
});

