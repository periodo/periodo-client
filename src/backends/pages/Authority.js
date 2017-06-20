"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('axs-ui')
    , { connect } = require('react-redux')
    , { Source } = require('lib/ui')
    , PeriodForm = require('../../editors/PeriodForm')

function mapStateToProps(state) {
  return {
    backend: state.backends.current,
  }
}

module.exports = connect(mapStateToProps)(class Authority extends React.Component {
  constructor() {
    super();

    this.state = {
      addingPeriod: false,
      period: {},
    }
  }

  render() {
    const { backend, id } = this.props
        , { addingPeriod, period } = this.state
        , authority = backend.dataset.periodCollections[id]

    return (
      h(Box, [
        h('h1', 'View authority'),
        h(Source, { source: authority.source }),

        h(PeriodForm, {
          value: period,
          onValueChange: period => {
            this.setState({ period })
          }
        })
      ])
    )
  }
})
