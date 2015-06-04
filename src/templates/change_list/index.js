"use strict";

var { groupByChangeType } = require('../../helpers/patch_collection')

function stripInputs(html) {
  var div = document.createElement('div')
    , toRemove = ['td:first-child', '.select-patch-header']

  div.innerHTML = html;
  [...div.querySelectorAll(toRemove.join(', '))]
    .forEach(el => el.parentNode.removeChild(el));

  return div.innerHTML;
}

module.exports = function (patches, { from, to }, noInputs) {
  var groupedPatches = groupByChangeType(patches)
    , html = ''

  /* Added period collections */
  if (groupedPatches.hasIn(['periodization', 'add'])) {
    let template = require('./period_collection_add');
    html += template(groupedPatches.getIn(['periodization', 'add']));
  }

  if (groupedPatches.hasIn(['periodization', 'edit'])) {
    // FIXME
  }

  if (groupedPatches.hasIn(['period', 'add'])) {
    let template = require('./period_add');
    html += template(groupedPatches.getIn(['period', 'add']), from, to);
  }

  if (groupedPatches.hasIn(['period', 'edit'])) {
    let template = require('./period_edit');
    html += template(groupedPatches.getIn(['period', 'edit']), from, to);
  }

  return noInputs ? stripInputs(html) : html;
}
