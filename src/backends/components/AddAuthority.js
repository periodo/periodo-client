"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box, Heading } = require('axs-ui')
    , generateID = require('../../linked-data/utils/generate_skolem_id')
    , { updateLocalDataset } = require('../actions')
    , AuthorityForm = require('../../editors/AuthorityForm')

module.exports = class AddAuthority extends React.Component {
  constructor() {
    super();

    this.state = {
      authority: {}
    }
  }

  render() {
    const { dispatch, backend, dataset } = this.props

    return (
      h(Box, [
        h(Heading, { level: 2 }, 'Add authority'),
        h(AuthorityForm, {
          value: this.state.authority,
          onValidated: authority => {
            const id = generateID()

            dispatch(updateLocalDataset(
              backend.storage,
              R.assocPath(
                ['periodCollections', id],
                Object.assign({ id }, authority),
                dataset
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
