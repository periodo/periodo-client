"use strict";

function isDataset(obj, includeLegacy=false) {
  return (
    typeof obj === 'object' && (
      typeof obj.authorities === 'object' ||
      (!!includeLegacy && typeof obj.periodCollections === 'object')
    )
  )
}

// The client should accept older versions of the dataset. This function
// should implement changes that are necessary for the client to continue
// to work.
//
// There is a directory of changes that have been applied to the dataset at:
//
// https://github.com/periodo/periodo-validation/blob/master/fix/
//
// It may make sense in the future to just apply these. But those functions
// would need to be changed to only work conditionally.
function normalizeDataset(dataset) {
  const ret = JSON.parse(JSON.stringify(dataset))

  let renamePeriodCollections = false
    , renamePeriods = false

  if (ret.periodCollections) {
    renamePeriodCollections = true;
    ret.authorities = ret.periodCollections;
    delete ret.periodCollections;
  }

  Object.values(ret.authorities).forEach(authority => {
    if (renamePeriodCollections) {
      authority.type = 'Authority';
    }

    if (authority.definitions) {
      renamePeriods = true;
      authority.periods = authority.definitions;
      delete authority.definitions;
    }

    Object.values(authority.periods || {}).forEach(period => {
      if (renamePeriods) {
        period.type = 'Period';
      }
    })
  })

  return ret;
}

module.exports = {
  isDataset,
  normalizeDataset,
}
