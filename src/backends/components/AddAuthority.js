"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box, Heading } = require('axs-ui')
    , { Breadcrumb, Link } = require('lib/ui')
    , generateID = require('../../linked-data/utils/generate_skolem_id')
    , { updateLocalBackendDataset } = require('../actions')
    , AuthorityForm = require('../../editors/AuthorityForm')

module.exports = class AddAuthority extends React.Component {
  constructor() {
    super();

    this.state = {
      authority: {}
    }
  }

  render() {
    const { dispatch, backend } = this.props

    return (
      h(Box, [
        h(Breadcrumb, [
          h(Link, { route: 'open-backend' }, 'Backends'),
          h(Link,
            { route: 'backend', params: { backendID: backend.type.asIdentifier() }},
            backend.metadata.label
          ),

          'Add authority'
        ]),

        h(Heading, { level: 2 }, 'Add authority'),
        h(AuthorityForm, {
          value: this.state.authority,
          onValidated: authority => {
            const id = generateID()

            dispatch(updateLocalBackendDataset(
              backend.type,
              R.assocPath(
                ['periodCollections', id],
                Object.assign({ id }, authority),
                backend.dataset
              ),
              `Added period collection ${id}`
            ))
          },
          onValueChange: authority => {
            this.setState({ authority })
          }
        }),
      ])
    )
  }
}
