"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('axs-ui')
    , { Source, Breadcrumb, Link } = require('lib/ui')
    , PeriodForm = require('../../editors/PeriodForm')

module.exports = class Authority extends React.Component {
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
        h(Breadcrumb, [
          h(Link, { route: 'open-backend' }, 'Backends'),
          h(Link,
            { route: 'backend', params: { backendID: backend.type.asIdentifier() }},
            backend.metadata.label
          ),

          'View authority'
        ]),

        h(Source, { source: authority.source }),

      ])
    )
  }
}
