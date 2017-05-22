"use strict";

const h = require('react-hyperscript')
    , randomstr = require('./randomstr')

module.exports = function (Component) {
  const str = randomstr()
      , randomID = identifier => `${identifier}-${str}`

  return props =>
    h(Component, Object.assign({}, props, {
      randomID
    }))
}
