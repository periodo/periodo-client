"use strict";

const h = require('react-hyperscript')
    , ReactDOM = require('react-dom')
    , fastclick = require('fastclick')
    , { createStore, applyMiddleware, compose } = require('redux')
    , thunk = require('redux-thunk').default
    , rootReducer = require('./reducers')
    , Root = require('./components/root')


function initialize() {
  const store = createStore(
    rootReducer,
    compose(
      applyMiddleware(thunk),
      window.devToolsExtension ? window.devToolsExtension() : undefined
    )
  )

  ReactDOM.render(h(Root, { store }), document.getElementById('main'))
}


fastclick(document.body);
initialize();
