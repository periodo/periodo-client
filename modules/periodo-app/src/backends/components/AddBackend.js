"use strict";

const h = require('react-hyperscript')
    , { useState } = require('react')
    , { Box, SectionHeading, Section } = require('periodo-ui')
    , { BackendForm } = require('../../forms')
    , BackendAction = require('../actions')
    , { BackendStorage } = require('../types')
    , { handleCompletedAction } = require('org-async-actions')

const AddBackend = props => {

  const [ urlError, setURLError ] = useState(undefined)

  return h(Box, [
    h(SectionHeading, 'Add data source'),
    h(Section, [
      h(BackendForm, {
        urlError,
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
              if (err.message &&
                  err.message === 'Key already exists in the object store.') {
                setURLError('There is already a data source with this URL.')
              } else {
                alert('Error saving data source')
                // eslint-disable-next-line no-console
                console.error(err)
              }
            }
          )
        },
      }),
    ]),
  ])
}

module.exports = AddBackend;
