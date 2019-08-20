"use strict";

const h = require('react-hyperscript')
    , { Box, ResourceTitle } = require('periodo-ui')
    , { BackendForm } = require('../../forms')
    , BackendAction = require('../actions')
    , { BackendStorage } = require('../types')
    , { handleCompletedAction } = require('org-async-actions')

const AddBackend = props =>
  h(Box, [
    h(ResourceTitle, 'Add backend'),
    h(BackendForm, {
      handleSave: async state => {
        const { label, description='', type, file } = state

        let storage

        if (type === 'Web') {
          storage = BackendStorage.WebOf(state)
        } else if (type === 'IndexedDB') {
          storage = BackendStorage.IndexedDB(null)
        } else if (type === 'StaticFile') {
          storage = BackendStorage.StaticFile(null, file)
        }

        const resp = await props.dispatch(
          BackendAction.CreateBackend(storage, label, description))

        handleCompletedAction(
          resp,
          props.onSave || (() => null),
          err => {
            alert('Error saving backend');
            // eslint-disable-next-line no-console
            console.error(err);
          }
        )
      },
    }),
  ])

module.exports = AddBackend;
