"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Heading } = require('periodo-ui')
    , { Route, LocationStreamAware } = require('org-shell')
    , { handleCompletedAction } = require('org-async-actions')
    , BackendAction = require('../actions')
    , { BackendForm } = require('../../forms')
    , ORCIDSettings = require('../../auth/components/ORCID')

module.exports = LocationStreamAware(function UpdateBackend(props) {
  const { backend } = props

  return (
    h(Flex, [
      h(Box, { flex: 1, mr: 4 }, [
        h(Heading, {
          level: 2,
          mb: 2,
        }, 'Backend details'),

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
      ]),

      props.backend.storage._name !== 'Web' ? null : (
        h(Box, { flex: 1 }, [
          h(Heading, {
            level: 2,
            mb: 2,
          }, 'ORCID credentials'),
          h(ORCIDSettings, { backend })
        ])
      )
    ])
  )
})
