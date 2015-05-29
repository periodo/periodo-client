"use strict";

var { getDisplayTitle } = require('../../helpers/source')
  , periodPatchedDiff = require('../../utils/period_patched_diff')
  , groupTemplate = require('./change_group.html')
  , categoryTemplate = require('./change_category.html')

module.exports = function (periods, fromState, toState) {
  var changeGroups = periods
    .map((periods, collectionID) => {
      var path = ['periodCollections', collectionID]
        , source = toState.getIn(path.concat('source'))
        , changes

      source = getDisplayTitle(source);

      changes = periods.map(patches => ({
        patches,
        html: periodPatchedDiff({}, patches)
      }));

      return groupTemplate({ changes, source })
    })
    .join('');

  return categoryTemplate({ title: 'New periods', changeGroups })
}
