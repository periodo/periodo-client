"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box, Heading } = require('axs-ui')
    , generateID = require('../../linked-data/utils/generate_skolem_id')
    , { updateLocalDataset } = require('../actions')
    , AuthorityForm = require('../../editors/AuthorityForm')
    , { trigger } = require('lib/router')

module.exports = class AddAuthority extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      authority: props.initialValue || {}
    }
  }

  render() {
    const { dispatch, backend, dataset } = this.props

    return (
      h(Box, [
        h(AuthorityForm, {
          value: this.state.authority,
          onValidated: async authority => {
            const id = generateID()

            await dispatch(updateLocalDataset(
              backend.storage,
              R.assocPath(
                ['periodCollections', id],
                Object.assign({ id }, authority),
                dataset
              ),
              `Added period collection ${id}`
            ))

            trigger('backend-home', {
              backendID: backend.asIdentifier()
            })
          },
          onValueChange: authority => {
            this.setState({ authority })
          }
        }),
      ])
    )
  }
}
