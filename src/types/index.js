"use strict";

function defineTypes(label, types) {
  const ns = exports[label] = {};

  types.forEach(typeName => {
    ns[typeName] = typeName;
  })

  Object.freeze(ns);
}

defineTypes('actions', require('./actions'));
defineTypes('backends', require('./backends'));
defineTypes('patchTypes', require('./patch_types'));

Object.freeze(exports);
