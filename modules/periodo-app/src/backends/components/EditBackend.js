"use strict";

const h = require('react-hyperscript')
    , { Box } = require('periodo-ui')
    , { Route, LocationStreamAware } = require('org-shell')
    , { handleCompletedAction } = require('../../typed-actions/utils')
    , BackendAction = require('../actions')
    , BackendForm = require('./BackendForm')

module.exports = LocationStreamAware(function UpdateBackend(props) {
  return (
    h(Box, [
      h(BackendForm, {
        backend: props.backend,
        handleDelete: async () => {
          if (!confirm('Really delete backend?')) return

          const resp = await props.dispatch(BackendAction.DeleteBackend(props.backend.storage))

          handleCompletedAction(
            resp,
            () => props.locationStream.write({
              route: Route('open-backend')
            }),
            err => {
              alert('Error deleting backend');
              // eslint-disable-next-line no-console
              console.error(err);
            }
          )
        },
        handleSave: async ({ label, description }) => {
          const resp = await props.dispatch(BackendAction.UpdateBackend(props.backend.storage, {
            label,
            description
          }))

          handleCompletedAction(
            resp,
            () => props.locationStream.write({
              route: Route('backend-home', {
                backendID: props.backend.asIdentifier(),
              })
            }),
            err => {
              alert('Error saving backend');
              // eslint-disable-next-line no-console
              console.error(err);
            }
          )
        }
      }),
    ])
  )
})
