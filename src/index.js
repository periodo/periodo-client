"use strict";

const h = require('react-hyperscript')
    , ReactDOM = require('react-dom')
    , fastclick = require('fastclick')
    , LocationBar = require('location-bar')
    , { Provider } = require('react-redux')
    , createStore = require('./application/store')
    , Application = require('./components/application')


function initialize() {
  const store = createStore()

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
