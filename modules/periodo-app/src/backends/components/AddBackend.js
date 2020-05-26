"use strict";

const h = require('react-hyperscript')
    , { useState, useRef } = require('react')
    , { Box, SectionHeading, Section, Button } = require('periodo-ui')
    , { BackendForm } = require('../../forms')
    , BackendAction = require('../actions')
    , { BackendStorage } = require('../types')
    , { handleCompletedAction } = require('org-async-actions')

function AddBackend({
  dispatch,
  onSave,
}) {
  const [ urlError, setURLError ] = useState(undefined)
      , inputRef = useRef(null)

  return (
    h(Box, [
      h(Box, [
        h('input', {
          type: 'file',
          ref: inputRef,
          style: {
            display: 'none',
          },
          async onChange(e) {
            const el = e.target
                , file = el.files[0]

            let backup

            try {
              backup = await new Promise((resolve, reject) => {
                const reader = new FileReader()

                reader.onload = () => {
                  try {
                    resolve(JSON.parse(reader.result))
                  } catch (e) {
                    reject(e)
                  }
                }

                reader.onerror = () => {
                  reject(reader.error)
                }

                reader.readAsText(file)
              })
            } catch (e) {
              el.value = null
              alert('Could not load backup')
            }

            el.value = null

            dispatch(BackendAction.ImportBackend(backup))
          },
        }),
        h(Button, {
          onClick() {
            inputRef.current.click()
          },
        }, 'Restore from backup'),
      ]),

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

            const action = await dispatch(
              BackendAction.CreateBackend(storage, label, description))

            handleCompletedAction(
              action,
              () => {
                if (onSave) {
                  onSave(action.readyState.response.backend)
                }
              },
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
  )
}

module.exports = AddBackend;
