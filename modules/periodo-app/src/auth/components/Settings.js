"use strict";

const h = require('react-hyperscript')
    , BackendAction = require('../../backends/actions')
    , LinkedDataAction = require('../../linked-data/actions')

const {
  Box,
  Button$Danger,
  Button$Default,
  Section,
  SectionHeading,
} = require('periodo-ui')

module.exports = function Settings(props) {
  const { dispatch } = props

  return (
    h(Box, [
      h(SectionHeading, 'In-browser data'),
      h(Section, [
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
