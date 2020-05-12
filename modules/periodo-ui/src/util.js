"use strict";

const h = require('react-hyperscript')
    , ss = require('styled-system')
    , linkifier = require('linkify-it')()
    , { ExternalLink } = require('./Links')

const ssProps = Object.values(ss.propTypes)
  .map(Object.keys)
  .reduce((a, b) => a.concat(b))

function blacklist(...keys) {
  return ssProps.concat(keys)
}

const linkify = text => {
  const links = linkifier.match(text)

  if (! links) { return [ text ] }

  const nodes = []

  let pos = 0

  links.forEach(match => {
    const minusOne = ',;.'.indexOf(match.url.slice(-1)) !== -1
        , href = minusOne ? match.url.slice(0, -1) : match.url
        , lastIndex = minusOne ? match.lastIndex - 1 : match.lastIndex

    nodes.push(text.slice(pos, match.index))
    nodes.push(h(ExternalLink, {
      key: nodes.length,
      href,
    }, href))
    nodes.push(text.slice(match.index + href.length, lastIndex))

    pos = lastIndex
  })

  nodes.push(text.slice(pos, text.length))

  return nodes
}

module.exports = {
  blacklist,
  linkify,
}
