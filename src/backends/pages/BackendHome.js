"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { connect } = require('react-redux')
    , { PeriodForm } = require('../../editors')

function mapStateToProps(state) {
  return {
    backend: state.backends.current
  }
}

class BackendHome extends React.Component {
  constructor() {
    super();

    this.state = {
      period: undefined
    }
  }

  render() {
    return (
      h('div', [
        h('h1', this.props.backend.metadata.label),
        h(PeriodForm, {
          period: this.state.period,
          onValueChange: period => {
            this.setState({ period })
          }
        }),
        // h('pre', JSON.stringify(props.backend.dataset, true, '  ')),
      ])
    )
  }
}

module.exports = connect(mapStateToProps)(BackendHome)
