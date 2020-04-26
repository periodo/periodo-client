"use strict";

const h = require('react-hyperscript')
    , { Box, Breadcrumb, Link } = require('periodo-ui')
    , { SectionHeading, Section } = require('periodo-ui')
    , { Route, Navigable } = require('org-shell')
    , { handleCompletedAction } = require('org-async-actions')
    , BackendAction = require('../actions')
    , { BackendForm } = require('../../forms')
    , ORCIDSettings = require('../../auth/components/ORCID')

module.exports = Navigable((props) => {
  const { backend } = props

  return (
    h(Box, [

      h(Breadcrumb, {
        ml: 1,
        mb: 3,
        truncate: [ 1 ],
      }, [
        h(Link, {
          route: Route('backend-home', {
            backendID: backend.asIdentifier(),
          }),
        }, backend.metadata.label),
        'Settings',
      ]),

      ...(
        props.backend.storage._name === 'Web'
          ? [
            h(SectionHeading, 'ORCID credentials'),
            h(Section, [ h(ORCIDSettings, { backend }) ]),
          ]
          : []
      ),

      h(SectionHeading, 'Data source settings'),
      h(Section, [

        h(BackendForm, {
          backend: props.backend,
          handleDelete: async () => {
            if (!confirm('Really delete data source?')) return

            const resp = await props.dispatch(
              BackendAction.DeleteBackend(props.backend.storage)
            )

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
            const resp = await props.dispatch(
              BackendAction.UpdateBackend(props.backend.storage, {
                label,
                description,
              })
            )

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
    ])
  )
})
