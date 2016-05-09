"use strict";

const React = require('react')
    , ReactDOM = require('react-dom')
    , { EventEmitter } = require('events')
    , fastclick = require('fastclick')
    , Router = require('./router')


window.periodo = new EventEmitter();
fastclick(document.body);


ReactDOM.render(
  React.createElement(Router),
  document.getElementById('main'))
