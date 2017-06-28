"use strict";

const h = require('react-hyperscript')
    , { connect } = require('react-redux')
    , { Box } = require('axs-ui')
    , BackendForm = require('./BackendForm')
    , { addBackend } = require('../actions')
    , { Backend } = require('../types')
    , { handleCompletedAction } = require('../../typed-actions/utils')
    , { Route, trigger } = require('lib/router')

const AddBackend = props =>
  h(Box, [
    h(BackendForm, {
      handleSave: async state => {
        const { label, description, type } = state

        const backend = type === 'Web'
            ? Backend.WebOf(state)
            : Backend.UnsavedIndexedDB()

        const resp = await props.addBackend(backend, label, description)

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
