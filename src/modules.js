"use strict";

const Type = require('union-type')
    , Route = require('route-parser')
    , { combineReducers } = require('redux')
    , modules = new Map()


function registerModules() {
  register('backends', require('./backends'))
  // register('auth', require('./auth'))
  // register('ld', require('./ld'))
  // register('patches', require('./patches'))
  // register('main', require('./main'))
}


const Resource = Type({ Resource: {
  name: String,
  path: String,
  onBeforeRoute: x => x === undefined || typeof x === 'function',

  // Don't really know how to make sure that this is a valid react component
  // (which could also be a purely functional component). Just check whether
  // it is defined, and it will explode if it doesn't render.
  Component: x => !!x,
}})

// badly named method but I don't particularly care
Resource.prototype.asObj = function () {
  return {
    name: this.name,
    route: new Route(this.path),
    onBeforeRoute: this.onBeforeRoute,
    Component: this.Component,
  }
}

const Module = Type({ Module: {
  reducer: x => x === undefined || typeof x === 'function',
  resources: x => x === undefined || Array.isArray(x)
}})

function register(ns, mod) {
  modules.set(ns, Module.ModuleOf(mod))
}

function getApplicationResources() {
  return [...modules.values()].reduce((acc, { resources=[] }) =>
    acc.concat(resources.map(
      resource => Resource.ResourceOf(resource).asObj()
    )),
    []
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
