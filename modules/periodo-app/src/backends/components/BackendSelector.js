"use strict";

const h = require('react-hyperscript')
    , { Box, Heading, Text, DropdownMenu, DropdownMenuItem } = require('periodo-ui')

module.exports = function BackendSelector({
  value,
  label,
  backends,
  onChange,
}) {

  return (
    h(DropdownMenu, {
      label: value
        ? value.metadata.label
        : label,
      onSelection: val => {
        onChange(val)
      },
    }, backends.map(backend =>
      h(DropdownMenuItem, {
        key: backend.asIdentifier(),
        value: backend,
      }, h(Box, [
        h(Heading, { level: 4 }, backend.metadata.label),
        h(Text, backend.storage.url),
      ])),
    ))
  )
}
