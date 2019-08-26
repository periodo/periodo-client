"use strict";

const h = require('react-hyperscript')
    , { Flex, Box, Heading } = require('periodo-ui')
    , { Route, Navigable } = require('org-shell')
    , { handleCompletedAction } = require('org-async-actions')
    , BackendAction = require('../actions')
    , { BackendForm } = require('../../forms')
    , ORCIDSettings = require('../../auth/components/ORCID')

module.exports = Navigable((props) => {
  const { backend } = props

  return (
    h(Flex, [
      h(Box, {
        flex: 1,
        mr: 4,
      }, [
        h(Heading, {
          level: 2,
          mb: 2,
        }, 'Data source configuration'),

        h(BackendForm, {
          backend: props.backend,
          handleDelete: async () => {
            if (!confirm('Really delete data source?')) return

            const resp = await props.dispatch(BackendAction.DeleteBackend(props.backend.storage))

            handleCompletedAction(
              resp,
              () => { props.navigateTo(Route('open-backend')) },
              err => {
                alert('Error deleting data source');
                // eslint-disable-next-line no-console
                console.error(err);
              }
            )
          },
          handleSave: async ({ label, description }) => {
            const resp = await props.dispatch(BackendAction.UpdateBackend(props.backend.storage, {
              label,
              description,
            }))

            handleCompletedAction(
              resp,
              () => props.navigateTo(Route('backend-home', {
                backendID: props.backend.asIdentifier(),
              })),
              err => {
                alert('Error saving data source');
                // eslint-disable-next-line no-console
                console.error(err);
              }
            )
          },
        }),
      ]),

      props.backend.storage._name !== 'Web' ? null : (
        h(Box, { flex: 1 }, [
          h(Heading, {
            level: 2,
            mb: 2,
          }, 'ORCID credentials'),
          h(ORCIDSettings, { backend }),
        ])
      ),
    ])
  )
})
