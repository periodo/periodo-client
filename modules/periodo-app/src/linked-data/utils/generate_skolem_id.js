"use strict";

const url = require('url')

module.exports = function (protocol=location.protocol, host=location.host, length=32) {
  let hexstr = '';

  for (let i = 0; i < length; i++) {
    hexstr += Math.floor(Math.random() * 16).toString(16);
  }

  return url.format({
    protocol,
    host,
    pathname: '/.well-known/genid/' + hexstr,
  });
}
