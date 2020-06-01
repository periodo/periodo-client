"use strict";

const h = require('react-hyperscript')
    , { Box, Breadcrumb, Link, Button } = require('periodo-ui')
    , { SectionHeading, Section } = require('periodo-ui')
    , { Route, Navigable } = require('org-shell')
    , { handleCompletedAction } = require('org-async-actions')
    , { saveAs } = require('file-saver')
    , BackendAction = require('../actions')
    , { BackendForm } = require('../../forms')
    , ORCIDSettings = require('../../auth/components/ORCID')
    , { periodoServerURL } = require('../../globals')
    , { stripUnionTypeFields } = require('periodo-common')


module.exports = Navigable((props) => {
  const { backend, dispatch, authState } = props
      , { authorized, authInfo } = authState

  if (! backend) { // backend was deleted
    return null
  }

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
        backend.storage.case({
          Web: () => ([
            h(SectionHeading, 'ORCID credentials'),
            h(Section, [
              h(ORCIDSettings, { backend }),

              !authorized ? null : (
                h(Box, { mt: 2 }, [
                  'Permissions:',
                  h(Box, {
                    as: 'ul',
                    ml: 2,
                  }, authInfo.permissions.map(name =>
                    h('li', name)
                  )),
                ])
              ),
            ]),
          ]),
          _: () => [],
        })
      ),

      h(SectionHeading, 'Data source settings'),
      h(Section, [

        h(BackendForm, {
          backend,
          handleDelete: backend.storage.url === periodoServerURL
            ? null
            : async () => {
              if (!confirm('Really delete data source?')) return

              const resp = await props.dispatch(
                BackendAction.DeleteBackend(backend.storage)
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
              BackendAction.UpdateBackend(backend.storage, {
                label,
                description,
              })
            )

            handleCompletedAction(
              resp,
              () => props.navigateTo(Route('backend-home', {
                backendID: backend.asIdentifier(),
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


      ...(
        backend.storage.case({
          IndexedDB: () => [
            h(SectionHeading, 'Back up data source'),
            h(Section, [
              h(Box, {
                as: 'p',
                mb: 3,
              }, 'Back up this data source to import later.'),
              h(Button, {
                async onClick() {
                  const resp = await dispatch(
                    BackendAction.GenerateBackendExport(backend.storage)
                  )

                  handleCompletedAction(
                    resp,
                    exportData => {
                      const exportJSON = new Blob([ JSON.stringify(stripUnionTypeFields(exportData, false)) ])

                      let dateLabel = new Date()
                      dateLabel = dateLabel.toISOString().split('T')[0]

                      saveAs(exportJSON, `periodo-backup_${backend.metadata.label}_${dateLabel}.json`)
                    },
                    err => {
                      console.error(err)
                    }
                  )
                },
              }, 'Create backup'),

            ]),
          ],
          _: () => [],
        })
      ),
    ])
  )
})
