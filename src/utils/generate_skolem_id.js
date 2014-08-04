"use strict";

var url = require('url')

module.exports = function (length) {
  var hexstr = '';

  length = length || 32;
  for (var i = 0; i < length; i++) {
    hexstr += Math.floor(Math.random() * 16).toString(16);
  }

  return url.format({
    protocol: location.protocol,
    host: location.host,
    pathname: '/.well-known/genid/' + hexstr
  });
}
