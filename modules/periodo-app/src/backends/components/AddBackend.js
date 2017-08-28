"use strict";

const h = require('react-hyperscript')
    , { connect } = require('react-redux')
    , { Box } = require('axs-ui')
    , BackendForm = require('./BackendForm')
    , { addBackend } = require('../actions')
    , { BackendStorage } = require('../types')
    , { handleCompletedAction } = require('../../typed-actions/utils')
    , { Route, trigger } = require('periodo-router')

const AddBackend = props =>
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
          () => trigger(Route('open-backend')),
          err => {
            alert('Error saving backend');
            console.error(err);
          }
        )
      }
    }),
  ])

module.exports = connect(undefined, { addBackend })(AddBackend)
