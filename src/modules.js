"use strict";

const Type = require('union-type')
    , { combineReducers } = require('redux')
    , modules = new Map()


function registerModules() {
  register('backends', require('./backends'));
  register('main', require('./main'));

  // register('auth', require('./auth'))
  // register('ld', require('./ld'))
  // register('patches', require('./patches'))
  // register('main', require('./main'))
}


const Module = Type({ Module: {
  reducer: x => x === undefined || typeof x === 'function',
  resources: x => x === undefined || typeof x === 'object',
}})

function register(ns, mod) {
  modules.set(ns, Module.ModuleOf(mod))
}

function getApplicationResources() {
  return [...modules.values()].reduce((acc, { resources={} }) =>
    Object.assign({}, resources, acc),
    {}
  )
}

function getApplicationReducer() {
  return combineReducers([...modules].reduce((acc, [label, { reducer }]) =>
    reducer
      ? Object.assign({}, acc, { [label]: reducer })
      : acc,
    {}
  ))
}

registerModules();

module.exports = {
  getApplicationResources,
  getApplicationReducer,
}
