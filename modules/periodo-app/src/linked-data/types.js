"use strict";

const makeActionType = require('../typed-actions/make_type')
    , { isURL } = require('periodo-utils/src/misc')

const LinkedDataAction = makeActionType('linkedData', {
  FetchLinkedData: [
    {
      url: isURL,
      opts: Object,
    },
    {
      triples: Array,
      prefixes: Object,
    }
  ],
  FetchORCIDs: [
    {
      orcids: Array,
    },
    {
      nameByORCID: Object,
    }
  ],
})

module.exports = {
  LinkedDataAction,
}
