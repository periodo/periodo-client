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
defineTypes('readyStates', require('./ready_states'));

Object.freeze(exports);
