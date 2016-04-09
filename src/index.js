"use strict";

var React = require('react')
  , { EventEmitter } = require('events')


window.periodo = new EventEmitter();


window.onload = function () {
  var Router = require('./router')
    , fastclick = require('fastclick')

  fastclick(document.body);

  React.render(<Router />, document.body);
}
