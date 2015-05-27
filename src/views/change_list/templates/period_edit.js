"use strict";

var { getDisplayTitle } = require('../../../helpers/source')
  , periodPatchedDiff = require('../../../utils/period_patched_diff')
  , groupTemplate = require('./change_group.html')
  , categoryTemplate = require('./change_category.html')

module.exports = function (periods, fromState, toState) {
  var changeGroups = periods
    .map((periods, collectionID) => {
      var path = ['periodCollections', collectionID]
        , source = toState.getIn(path.concat('source'))
        , changes

      source = getDisplayTitle(source);

      changes = periods.map((patches, periodID) => {
        // FIXME Should this be to or from?
        var oldPeriod = toState.getIn(path.concat('definitions', periodID))
          , html = periodPatchedDiff(oldPeriod, patches)

        return { patches, html }
      });

      return groupTemplate({ changes, source })
    })
    .join('');

  return categoryTemplate({ title: 'Edited periods', changeGroups })
}
