"use strict";

const h = require('react-hyperscript')
    , ReactDOM = require('react-dom')
    , fastclick = require('fastclick')
    , thunk = require('redux-thunk').default
    , { createStore, applyMiddleware, compose } = require('redux')
    , LocationBar = require('location-bar')
    , { Provider } = require('react-redux')
    , Application = require('./components/application')
    , rootReducer = require('./reducers')
    , periodoDB = require('./db')


function initialize() {
  const store = createStore(
    rootReducer,
    compose(
      applyMiddleware(thunk.withExtraArgument({ db: periodoDB() })),
      window.devToolsExtension ? window.devToolsExtension() : a => a
    )
  )

  const component = (
    h(Provider, { store }, [
      h(Application, {
        router: require('./router')(),
        locationBar: new LocationBar()
      })
    ])
  )

  ReactDOM.render(component, document.getElementById('main'))
}


fastclick(document.body);
initialize();
