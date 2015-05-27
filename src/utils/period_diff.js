"use strict";

var _ = require('underscore')
  , Immutable = require('immutable')
  , DiffMatchPatch = require('diff-match-patch')
  , dmp = new DiffMatchPatch()


// Takes a period and returns an object with key (field name), val (DOM Node)
function periodToNodesObj(period) {
  var container

  if (!period || _.isEmpty(period)) return [];

  container = document.createElement('div');
  container.innerHTML = require('../templates/period.html')({ period });

  return Immutable.List(container.querySelectorAll('.field'))
    .toOrderedMap()
    .mapEntries(([,el]) => [
      el.children[0].textContent.trim(),
      el.children[1]
    ]);
}


// Compare two lists, and return which items were in the first; which were
// in the second; and which were in both.
function setDiff(fromarr, toarr) {
  var fromSet = Immutable.OrderedSet(fromarr)
    , toSet = Immutable.OrderedSet(toarr)

  return {
    from: fromSet.subtract(toSet).toJS(),
    to: toSet.subtract(fromSet).toJS(),
    both: fromSet.intersect(toSet)
  }
}


function getNestedText(el) {
  return [...el.children[0].children].map(item => item.textContent.trim());
}


function makeNestedDiff(key, fromEl, toEl) {
  var texts = [fromEl, toEl].map(getNestedText)
    , diffs = setDiff(...texts)
    , html = ''

  html += `<dt>${key}</dt><dd><ul>`;

  html += diffs.both
    .map(text => `<li>${text}</li>`)
    .join('');

  html += diffs.from
    .map(text => `<li><span class="diff-deletion">${text}</span></li>`)
    .join('');

  html += diffs.to
    .map(text => `<li><span class="diff-addition">${text}</span></li>`)
    .join('');

  html += '</ul></dd>';

  return html;
}


module.exports = function (from, to) {
  var fromEls = periodToNodesObj(from)
    , toEls = periodToNodesObj(to)
    , html = '<dl class="dl-horizontal">'

  fromEls.forEach((fromEl, key) => {
    var toEl = toEls.get(key)

    if (!toEl) {
      // This is a field that was only present in the "before" period, so it
      // has been deleted in the "after" one.
      html += `
        <div class="diff-deletion">
          <dt>${key}</dt>
          <dd>${fromEl.innerHTML}</dd>
        </div>
      `
    } else if (fromEl.children.length) {
      // This is a nested field (i.e. spatialCoverage)
      html += makeNestedDiff(key, fromEl, toEl);
    } else {
      // This is a text field that differs from the "before" period to the
      // "after" one, so we create an HTML representation of that difference.
      let diff = dmp.diff_main(fromEl.textContent.trim(), toEl.textContent.trim())
        , diffHTML = dmp.diff_prettyHtml(diff)

      html += `<dt>${key}</dt><dd>${diffHTML}</dd>`
    }

    toEls = toEls.delete(key);
  });

  // All remaining fields are only in the "after" period, so they are additions.
  toEls.forEach((toEl, key) => {
    html += `
      <div class="diff-addition">
        <dt>${key}</dt>
        <dd>${toEl.innerHTML}</dd>
      </div>
    `
  });

  html += '</dl>';
  return html;
}
