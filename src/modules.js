"use strict";
const Route = require('route-parser')
    , { combineReducers } = require('redux')

const MODULES = {
  backends: require('./backends'),
  // auth: require('./auth'),
  // ld: require('./linked-data'),
  // patches: require('./patches'),
  //
  // /* MUST BE LAST */
  // periodo: require('./periodo'),
}

// TODO: Maybe some sanity checking for modules?

function getApplicationRoutes() {
  return Object.keys(MODULES).reduce((acc, label) => {
    const { routes=[] } = MODULES[label]

    return acc.concat(routes.map(([name, path, { Component, onBeforeRoute }]) => ({
      name,
      route: new Route(path),
      Component,
      onBeforeRoute,
    })))
  }, []);
}

function getApplicationReducer() {
  return combineReducers(Object.keys(MODULES).reduce((acc, label) => {
    const { reducer } = MODULES[label]

    return reducer ? Object.assign({}, acc, { [label]: reducer }) : acc;
  }, {}))
}

module.exports = {
  getApplicationRoutes,
  getApplicationReducer,
}
