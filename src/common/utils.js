"use strict";

const url = require('url')

module.exports = {
  isURL,
}

function isURL(str) {
  if (!(typeof str === 'string')) {
    throw new Error('URL must be a string')
  }

  const { protocol, host } = url.parse(str)

  if (!(protocol && host)) {
    throw new Error(`Invalid URL: ${str}`);
  }

  return true;
}
