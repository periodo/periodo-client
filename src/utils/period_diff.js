"use strict";

var _ = require('underscore')
  , $ = require('jquery')
  , DiffMatchPatch = require('diff-match-patch')
  , dmp = new DiffMatchPatch()
  , template = require('../templates/period.html')

function periodToNodesObj(period) {
  var nodes;

  if (!period || _.isEmpty(period)) {
    nodes = [];
  } else {
    nodes = $(template({ period: period })).find('.field').toArray();
  }

  return Array.prototype.reduce.call(nodes, function (acc, el) {
    var key = el.children[0].textContent.trim();
    var val = el.children[1];
    acc[key] = val;
    return acc;
  }, {});
}

// Compare two lists, and return which items were in the first; which were
// in the second; and which were in both.
function setDiff(fromarr, toarr) {
  var ret = { both: [], from: [], to: [] }
    , fromcmp = _.unique(fromarr).sort()
    , tocmp = _.unique(toarr).sort()
    , i = fromcmp.length - 1
    , j = tocmp.length - 1

  while (i >= 0) {
    let item = fromcmp[i]
      , found = false

    for (; j >= 0; j--) {
      if (tocmp[j] !== undefined && tocmp[j] === item) {
        ret.both.push(tocmp.splice(j, 1)[0]);
        found = true;
        j--;
        break;
      }
    }

    if (!found) ret.from.push(item);
    if (j === -1) j++;
    i--;
  }

  ret.to = ret.to.concat(tocmp);

  return ret;
}

module.exports = function (from, to) {
  var fromNodes = periodToNodesObj(from)
    , toNodes = periodToNodesObj(to)
    , ret = '<dl class="dl-horizontal">'

  _.forEach(fromNodes, function (fromEl, key) {
    var toEl = toNodes[key];

    if (!toEl) {
      ret += '<div class="diff-deletion"><dt>' + key + '</dt><dd>' + toEl.innerHTML + '</dd></div>';
    } else if (fromEl.children.length) {
      let fromListItems = fromEl.children[0].children
        , toListItems = toEl.children[0].children
        , fromListText = Array.prototype.map.call(fromListItems, el => el.textContent.trim())
        , toListText = Array.prototype.map.call(toListItems, el => el.textContent.trim())
        , diffs = setDiff(fromListText, toListText)

      ret += '<dt>' + key + '</dt><dd><ul>';
      ret += diffs.both.map(text => '<li>' + text + '</li>').join('');
      if (diffs.from) {
        ret += diffs.from
          .map(text => '<li><span class="diff-deletion">' + text + '</span></li>')
          .join('');
      }
      if (diffs.to) {
        ret += diffs.to
          .map(text => '<li><span class="diff-addition">' + text + '</span></li>')
          .join('');
      }
      ret += '</ul></dd>';
    } else {
      let diff = dmp.diff_main(fromEl.textContent.trim(), toEl.textContent.trim());
      let html = dmp.diff_prettyHtml(diff);
      ret += '<dt>' + key + '</dt><dd>' + html + '</dd>';
    }

    delete toNodes[key];
  });

  _.forEach(toNodes, function (toEl, key) {
    ret += '<div class="diff-addition"><dt>' + key + '</dt><dd>' + toEl.innerHTML + '</dd></div>';
  });

  ret += '</dl>';

  return ret;
}
