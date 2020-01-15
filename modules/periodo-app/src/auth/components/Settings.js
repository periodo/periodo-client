"use strict";

const h = require('react-hyperscript')
    , BackendAction = require('../../backends/actions')
    , LinkedDataAction = require('../../linked-data/actions')

const {
  Heading,
  Box,
  ResourceTitle,
  Button$Danger,
  Button$Default,
} = require('periodo-ui')

module.exports = function Settings(props) {
  const { dispatch, settings } = props

  return (
    h(Box, [
      h(ResourceTitle, 'Settings'),

      h(Box, { mb: 3 }, [
        h(Heading, {
          level: 3,
          mb: 1,
        }, 'In-browser data'),

        h(Button$Default, {
          mr: 2,
          onClick: async () => {
            await dispatch(LinkedDataAction.ClearLinkedDataCache);
            window.location.reload()
          },
        }, 'Clear linked data cache'),

        h(Button$Danger, {
          onClick: async () => {
            if (confirm('Continue deleting all data sources? In-browser data is only stored on your own computer and will not be able to be recovered.')) {
              await dispatch(BackendAction.DeleteAllBackends);
              window.location.reload()
            }
          },
        }, 'Clear all data'),
      ]),
    ])
  )
}
