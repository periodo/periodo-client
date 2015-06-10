"use strict";

var linkify = require('linkify-it')()

module.exports = function (html, blank=true) {
  var links = linkify.match(html) || []

  links.reverse().forEach(match => {
    let minusOne = ',;.'.indexOf(match.url.slice(-1)) !== -1
      , url = minusOne ? match.url.slice(0, -1) : match.url
      , lastIndex = minusOne ? match.lastIndex - 1 : match.lastIndex

    html = (
      html.slice(0, match.index) +
      `<a ${blank ? 'target="_blank"' : ''} href=${url}>${url}</a>` +
      html.slice(lastIndex)
    )
  });

  return html
}
