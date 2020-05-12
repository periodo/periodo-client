"use strict";

const h = require('react-hyperscript')
    , React = require('react')

function randomstr() {
  return (Math.random() + '').slice(2, 12)
}

function makeRandomID(Component) {
  return class RandomID extends React.Component {
    constructor() {
      super();

      const str = randomstr()
      this.randomID = identifier => `${identifier}-${str}`
    }

    render() {
      return h(Component, {
        ...this.props,
        randomID: this.randomID,
      })
    }
  }
}

module.exports = {
  RandomID: makeRandomID,
}
