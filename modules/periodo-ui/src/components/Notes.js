"use strict"

const h = require('react-hyperscript')
    , { Box } = require('./Base')
    , { LinkifiedTextValue } = require('./diffable/Value')

function EditorialNote({ text, ...props }) {
  return h(Box,
    {
      mt: 3,
      maxWidth: '60em',
      ...props,
    },
    h(LinkifiedTextValue, {
      value: { text },
    })
  )
}

function Note({ cite, ...props }) {
  return EditorialNote({
    is: 'blockquote',
    borderLeft: '4px solid',
    borderColor: 'gray.3',
    css: {
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
    pl: 1,
    cite,
    ...props,
  })
}

module.exports = {
  Note,
  EditorialNote,
}
