"use strict";

const h = require('react-hyperscript')
    , { Box, ResourceTitle } = require('periodo-ui')
    , BackendForm = require('./BackendForm')
    , BackendAction = require('../actions')
    , { BackendStorage } = require('../types')
    , { handleCompletedAction } = require('../../typed-actions/utils')
    , { Route, LocationStreamAware } = require('org-shell')

const AddBackend = LocationStreamAware(props =>
  h(Box, [
    h(ResourceTitle, 'Add backend'),
    h(BackendForm, {
      handleSave: async state => {
        const { label, description='', type } = state

        const storage = type === 'Web'
            ? BackendStorage.WebOf(state)
            : BackendStorage.IndexedDB(null)

        const resp = await props.dispatch(
          BackendAction.CreateBackend(storage, label, description))

        handleCompletedAction(
          resp,
          () => props.locationStream.write({ route: Route('open-backend') }),
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

module.exports = AddBackend;
