"use strict";

const ss = require('styled-system')

const ssProps = Object.values(ss.propTypes)
  .map(Object.keys)
  .reduce((a, b) => a.concat(b))

function blacklist(...keys) {
  return ssProps.concat(keys)
}

module.exports = {
  blacklist,
}
