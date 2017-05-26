"use strict";

function isReactComponent(obj) {
  return 'isReactComponent' in (obj.prototype || {})
}

function validateLayoutRenderer(val) {
  if ('isReactComponent' in (val.prototype || {})) return;

  const isValid = (
    typeof val === 'object' &&
    typeof val.init === 'function' &&
    typeof val.update === 'function'
  )

  if (isValid) return;

  let msg = `Layout ${val.label} `;

  if (val === undefined) {
    msg += 'has not defined a `render` property.';
  } else {
    msg += 'has defined an invalid `render` property.';
  }

  msg += (
    'A Layout renderer must be either:\n' + 
    '  1. An object with init() and update() properties\n' +
    '  2. A React component.'
  )

  return new Error(msg)
}

module.exports = {
  isReactComponent,
  validateLayoutRenderer,
}
