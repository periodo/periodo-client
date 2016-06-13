"use strict";

const h = require('react-hyperscript')
    , ReactDOM = require('react-dom')
    , fastclick = require('fastclick')
    , thunk = require('redux-thunk').default
    , { createStore, applyMiddleware, compose } = require('redux')
    , Root = require('./components/root')
    , rootReducer = require('./reducers')
    , periodoDB = require('./db')


function initialize() {
  const store = createStore(
    rootReducer,
    compose(
      applyMiddleware(thunk.withExtraArgument({ db: periodoDB() })),
      window.devToolsExtension ? window.devToolsExtension() : undefined
    )
  )

  ReactDOM.render(h(Root, { store }), document.getElementById('main'))
}


fastclick(document.body);
initialize();
