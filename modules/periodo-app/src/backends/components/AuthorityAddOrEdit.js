"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Box } = require('periodo-ui')
    , BackendAction = require('../actions')
    , AuthorityForm = require('../../forms/AuthorityForm')
    , { Navigable, Route } = require('org-shell')
    , createSkolemID = require('../../linked-data/utils/generate_skolem_id')

class AuthorityAddOrEdit extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      authority: props.authority || {},
    }
  }

  render() {
    const { authority } = this.state
        , isEdit = !!authority.id

    const {
      dispatch,
      backend,
      dataset,
      navigateTo,
    } = this.props

    return (
      h(Box, [
        h(AuthorityForm, {
          mb: 4,
          value: authority,
          onValidated: async authority => {

            const id = isEdit ? authority.id : createSkolemID()

            await dispatch(BackendAction.UpdateLocalDataset(
              backend.storage,
              R.assocPath(
                [ 'authorities', id ],
                {
                  id,
                  ...authority,
                },
                dataset.raw
              ),
              isEdit
                ? `Edited authority ${id}`
                : `Added authority ${id}`
            ))

            navigateTo(Route('authority-view', {
              backendID: backend.asIdentifier(),
              authorityID: id,
            }))
          },

          onCancel: !isEdit ? null : () => {
            navigateTo(Route('authority-view', {
              backendID: backend.asIdentifier(),
              authorityID: authority.id,
            }))
          },

          onDelete: !isEdit ? null : async () => {
            const updatedRawDataset = R.dissocPath(
              [ 'authorities', authority.id ],
              dataset.raw)

            const message = `Deleted authority ${authority.id}`

            await dispatch(BackendAction.UpdateLocalDataset(
              backend.storage,
              updatedRawDataset,
              message
            ))

            navigateTo(new Route('backend-home', {
              backendID: backend.asIdentifier(),
            }))
          },

          onValueChange: authority => {
            this.setState({ authority })
          },
        }),
      ])
    )
  }
}

module.exports = Navigable(AuthorityAddOrEdit)
