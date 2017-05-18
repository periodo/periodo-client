"use strict";

const h = require('react-hyperscript')
    , ReactDOM = require('react-dom')
    , fastclick = require('fastclick')
    , { Provider } = require('react-redux')
    , createStore = require('./store')
    , Application = require('./components/application')


if (process.browser) {
  const store = createStore()

  fastclick(document.body);

  const component = (
    h(Provider, { store }, [
      h(Application)
    ])
  )

  ReactDOM.render(component, document.getElementById('main'))
}
