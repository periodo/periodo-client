"use strict"

const { $$Authority } = require('periodo-utils/src/symbols')

module.exports = function indexItems(rawDataset) {
  const authoritiesByID = {}
      , periodsByID = {}

  Object.values(rawDataset.authorities || {}).forEach(authority => {
    authoritiesByID[authority.id] = authority
    Object.values(authority.periods || {}).forEach(period => {
      periodsByID[period.id] = period
      period[$$Authority] = authority
    })
  })

  return {
    authoritiesByID,
    periodsByID,
    authorities: Object.values(authoritiesByID),
    periods: Object.values(periodsByID),
  }
}
