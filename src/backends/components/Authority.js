"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box } = require('axs-ui')
    , { Source, Breadcrumb, Link } = require('lib/ui')
    , { Route } = require('lib/router')
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
          h(Link, { href: Route('open-backend') }, 'Backends'),
          h(Link, {
            href: Route('backend', {
              backendID: backend.type.asIdentifier(),
            })
          }, backend.metadata.label),

          'View authority'
        ]),

        h(Source, { source: authority.source }),

      ])
    )
  }
}
