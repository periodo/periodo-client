"use strict";

const h = require('react-hyperscript')
    , ReactDOM = require('react-dom')
    , fastclick = require('fastclick')
    , LocationBar = require('location-bar')
    , { combineReducers } = require('redux')
    , { Provider } = require('react-redux')
    , createStore = require('./application/store')
    , Application = require('./components/application')
    , { makeApplicationStream } = require('./routes')

const MODULES = {
  backends: require('./backends'),
  // auth: require('./auth'),
  // ld: require('./linked-data'),
  // patches: require('./patches'),
  //
  // /* MUST BE LAST */
  // periodo: require('./periodo'),
}

// If testing is true, will use redux-mock-store, which keeps a log of all
// dispatched actions
function getAppGuts(storage, testing=false) {
  const modules = {}

  Object.keys(MODULES).forEach(label => {
    const routes = []
        , reducers = {}
        , mod = modules[label]

    if (mod.reducer) {
      reducers[label] = mod.reducer;
    }

    if (mod.routes) {
      mod.routes.forEach(([name, path, { Component, onBeforeRoute }]) => {
        routes.push({
          name,
          route: new Route(path),
          Component,
          onBeforeRoute,
        })
      })
    }

    return {
      routes,
      reducer: combineReducers(reducers),
      store: createStore(storage, testing),
    }
  })

}

if (process.browser) {
  const { routes, store } = getAppGuts();

  makeApplicationStream(store.dispatch);
  fastclick(document.body);

  const component = (
    h(Provider, { store }, [
      h(Application)
    ])
  )

  ReactDOM.render(component, document.getElementById('main'))
}
