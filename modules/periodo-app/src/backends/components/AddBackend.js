"use strict";

const h = require('react-hyperscript')
    , { connect } = require('react-redux')
    , { Box } = require('periodo-ui')
    , BackendForm = require('./BackendForm')
    , { addBackend } = require('../actions')
    , { BackendStorage } = require('../types')
    , { handleCompletedAction } = require('../../typed-actions/utils')
    , { Route, LocationStreamAware } = require('org-shell')

const AddBackend = LocationStreamAware(props =>
  h(Box, [
    h(BackendForm, {
      handleSave: async state => {
        const { label, description, type } = state

        const storage = type === 'Web'
            ? BackendStorage.WebOf(state)
            : BackendStorage.IndexedDB(null)

        const resp = await props.addBackend(storage, label, description)

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

module.exports = connect(undefined, { addBackend })(AddBackend)
