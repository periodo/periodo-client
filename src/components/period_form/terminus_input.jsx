"use strict";

var React = require('react')
  , Immutable = require('immutable')

const emptyTerminus = Immutable.fromJS({ label: '', in: { year: '' }})

module.exports = React.createClass({
  displayName: 'TerminusInput',
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
    var parseDate = require('../../utils/date_parser.js')
      , parsed = parseDate(e.target.value)

    if (parsed) {
      this.setState({ terminus: Immutable.fromJS(parsed).delete('_type') })
    } else {
      this.setState({ terminus: emptyTerminus })
    }
  },

  render: function () {
    var Input = require('../shared/input.jsx')

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

