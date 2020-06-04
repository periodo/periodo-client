"use strict"

const h = require('react-hyperscript')
    , { Box } = require('./Base')
    , { LinkifiedTextValue } = require('./diffable/Value')

function EditorialNote({ text, ...props }) {
  return (
    h(Box, {
      sx: {
        mt: 3,
        maxWidth: '60em',
      },
      ...props,
    }, [
      h(LinkifiedTextValue, {
        value: { text },
      }),
    ])
  )
}

function Note({ cite, ...props }) {
  return (
    h(EditorialNote, {
      as: 'blockquote',
      sx: {
        pl: 1,
        mt: 3,
        maxWidth: '60em',
        borderLeft: '4px solid',
        borderColor: 'gray.3',
        fontStyle: 'italic',
        quotes: "'“' '”' '‘' '’'",
        '::before': {
          color: '#ced4da',
          content: 'open-quote',
          fontSize: '2em',
          lineHeight: '0.1em',
          marginRight: '0.25em',
          verticalAlign: '-0.4em',
        },
      },
      cite,
      ...props,
    })
  )
}

module.exports = {
  Note,
  EditorialNote,
}
