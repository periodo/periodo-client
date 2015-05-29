"use strict"

var Immutable = require('immutable')
  , { describe } = require('../../helpers/periodization')
  , groupTemplate = require('./change_group.html')
  , categoryTemplate = require('./change_category.html')
  , template = require('./period_collection_add.html')

module.exports = function (collections) {
  var changeGroups = collections
    .map(patch => ({
      patches: patch,
      html: template({ collection: describe(patch.get('value')) })
    }))
    .map(change => groupTemplate({ changes: [change], source: undefined }))
    .join('')

  return categoryTemplate({ title: 'New period collections', changeGroups });
}
