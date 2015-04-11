"use strict";

var _ = require('underscore')
  , $ = require('jquery')
  , DiffMatchPatch = require('diff-match-patch')
  , dmp = new DiffMatchPatch()
  , template = require('../templates/period.html')

function d(period) {
  var nodes = $(template({ period: period })).find('.field').toArray()
    , ret = {}

  return Array.prototype.reduce.call(nodes, function (acc, el) {
    var key = el.children[0].textContent.trim();
    var val = el.children[1];
    acc[key] = val;
    return acc;
  }, {});
}

module.exports = function (from, to) {
  var fromNodes = d(from)
    , toNodes = d(to)
    , ret = '<dl class="dl-horizontal">'

  _.forEach(fromNodes, function (fromEl, key) {
    var toEl = toNodes[key];

    if (!toEl) {
      ret += '<div class="diff-addition"><dt>' + key + '</dt><dd>' + toEl.innerHTML + '</dd></div>';
    } else if (fromEl.children.length) {
      let fromListItems = fromEl.children[0].children
        , toListItems = fromEl.children[0].children
        , fromListText = Array.prototype.map.call(fromListItems, el => el.textContent.trim()).join('\n')
        , toListText = Array.prototype.map.call(toListItems, el => el.textContent.trim()).join('\n')
        , diff = dmp.diff_main(fromListText, toListText)
        , html = dmp.diff_prettyHtml(diff);
        , html = html.split('\n').map(text => '<li>' + text + '</li>').join('\n')

      ret += '<dt>' + key + '</dt><dd>' + html + '</dd>';

    } else {
      let diff = dmp.diff_main(fromEl.textContent.trim(), toEl.textContent.trim());
      let html = dmp.diff_prettyHtml(diff);
      ret += '<dt>' + key + '</dt><dd>' + html + '</dd>';
    }

    delete toNodes[key];
  });

  _.forEach(toNodes, function (toEl, key) {
    ret += '<div class="diff-deletion"><dt>' + key + '</dt><dd>' + toEl.innerHTML + '</dd></div>';
  });

  ret += '</dl>';

  return ret;
}
