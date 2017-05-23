"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , randomstr = require('./randomstr')

module.exports = function (Component) {
  return class RandomID extends React.Component {
    constructor() {
      super();

      const str = randomstr()
      this.randomID = identifier => `${identifier}-${str}`
    }

    render() {
      return h(Component, Object.assign({}, this.props, {
        randomID: this.randomID
      }))
    }
  }
}
